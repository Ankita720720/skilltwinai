import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff, ChevronRight, Video, VideoOff, Volume2, VolumeX, X, RotateCcw, Clock, Lightbulb } from 'lucide-react';
import { Card, CardHead, PageHeader, Btn, Badge, Progress, Empty, Ring, Spinner, timeAgo, scoreColor } from '../components/ui';
import { HeroCard, heroPrimary } from '../components/HeroCard';
import { useData } from '../store/DataContext';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';
import { supabase } from '../lib/supabase';
import { scoreAnswer, summarize, MODES, modeMeta, trackLabel, starParts, type Mode } from '../lib/interview';
import { shuffle } from '../lib/engine';
import type { InterviewAnswer, InterviewQuestion, InterviewTrack } from '../lib/types';

/* ---- minimal Web Speech API typings (not in lib.dom for all TS versions) ---- */
type SRResult = { isFinal: boolean; 0: { transcript: string } };
type SR = {
  start: () => void; stop: () => void; abort: () => void;
  onresult: ((e: { results: ArrayLike<SRResult> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  continuous: boolean; interimResults: boolean; lang: string;
};
type SRCtor = new () => SR;
const getSR = (): SRCtor | undefined => {
  const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
const toneFor = (t: string): 'purple' | 'amber' | 'teal' | 'green' | 'slate' => (({ technical: 'purple', behavioral: 'teal', hr: 'amber', situational: 'green' } as Record<string, 'purple' | 'amber' | 'teal' | 'green'>)[t] ?? 'slate');

/** Picks the questions for a session. Technical questions favour the learner's weakest skills. */
function buildPool(all: InterviewQuestion[], mode: Mode, count: number, weak: Map<string, number>): InterviewQuestion[] {
  const by = (t: InterviewTrack) => shuffle(all.filter((q) => q.track === t));
  const tech = by('technical').sort((a, b) => (weak.get(a.skill_id ?? '') ?? 99) - (weak.get(b.skill_id ?? '') ?? 99));
  const lists: Record<InterviewTrack, InterviewQuestion[]> = { technical: tech, behavioral: by('behavioral'), hr: by('hr'), situational: by('situational') };
  if (mode !== 'mixed') return lists[mode].slice(0, count);

  // Full mock: ~40% technical, 20% each for the other rounds (remainders go to technical first)
  const order: InterviewTrack[] = ['technical', 'behavioral', 'hr', 'situational'];
  const share: Record<InterviewTrack, number> = { technical: Math.floor(count * 0.4), behavioral: Math.floor(count * 0.2), hr: Math.floor(count * 0.2), situational: Math.floor(count * 0.2) };
  let left = count - order.reduce((n, t) => n + share[t], 0);
  for (let i = 0; left > 0; i = (i + 1) % order.length, left--) share[order[i]]++;
  const picked: InterviewQuestion[] = [];
  order.forEach((t) => picked.push(...lists[t].slice(0, share[t])));
  if (picked.length < count) { // a round ran short → top up from whatever is left
    const used = new Set(picked.map((q) => q.id));
    picked.push(...shuffle(Object.values(lists).flat().filter((q) => !used.has(q.id))).slice(0, count - picked.length));
  }
  // run the rounds like a real drive: HR intro → technical → behavioral → situational
  const rank: Record<string, number> = { hr: 0, technical: 1, behavioral: 2, situational: 3 };
  return picked.sort((a, b) => rank[a.track] - rank[b.track]);
}

/* ---------------------------------------------------------------------------------------------- */
function CameraPane({ on, onToggle, speakerOn, onSpeaker, tip }: { on: boolean; onToggle: () => void; speakerOn: boolean; onSpeaker: () => void; tip: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<'idle' | 'starting' | 'live' | 'denied' | 'unsupported' | 'error'>('idle');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!on) { setState('idle'); return; }
    if (!navigator.mediaDevices?.getUserMedia) { setState('unsupported'); return; }
    let stream: MediaStream | null = null;
    let cancelled = false;
    const video = ref.current;
    setState('starting');
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      .then((s) => {
        if (cancelled) { s.getTracks().forEach((t) => t.stop()); return; }
        stream = s;
        if (video) { video.srcObject = s; video.play().catch(() => { /* autoplay is allowed for muted video */ }); }
        setState('live');
      })
      .catch((e: { name?: string }) => { if (!cancelled) setState(e?.name === 'NotAllowedError' || e?.name === 'SecurityError' ? 'denied' : 'error'); });
    return () => { cancelled = true; stream?.getTracks().forEach((t) => t.stop()); if (video) video.srcObject = null; };
  }, [on, attempt]);

  const msg: Record<string, string> = {
    idle: 'Camera is off. Turn it on to practise eye contact and posture.',
    starting: 'Starting camera… allow access in your browser if asked.',
    denied: 'Camera permission was blocked. Click the camera icon in the address bar, allow access, then press “Try again”.',
    unsupported: 'Camera needs a secure page (https:// or localhost) and a supported browser.',
    error: 'Could not start the camera. Check that no other app is using it.',
  };

  return (
    <div className="space-y-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-navy-deep shadow-lg">
        <video ref={ref} muted playsInline className={`h-full w-full object-cover ${state === 'live' ? '' : 'invisible'}`} style={{ transform: 'scaleX(-1)' }} />
        {state !== 'live' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-slate-200">
            {on && state === 'starting' ? <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <VideoOff className="h-8 w-8 opacity-70" />}
            <p className="max-w-xs text-xs leading-relaxed">{msg[state]}</p>
            {(state === 'denied' || state === 'error') && <Btn variant="ghost" onClick={() => setAttempt((n) => n + 1)}><RotateCcw className="h-4 w-4" /> Try again</Btn>}
          </div>
        )}
        {state === 'live' && <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Camera on · local only</span>}
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
          <button onClick={onToggle} title={on ? 'Turn camera off' : 'Turn camera on'} className={`flex h-10 w-10 items-center justify-center rounded-full text-white shadow ${on ? 'bg-white/20 backdrop-blur hover:bg-white/30' : 'bg-red-600 hover:bg-red-700'}`}>{on ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}</button>
          <button onClick={onSpeaker} title={speakerOn ? 'Mute interviewer voice' : 'Let the interviewer read questions aloud'} className={`flex h-10 w-10 items-center justify-center rounded-full text-white shadow ${speakerOn ? 'bg-white/20 backdrop-blur hover:bg-white/30' : 'bg-red-600 hover:bg-red-700'}`}>{speakerOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}</button>
        </div>
      </div>
      <div className="flex items-start gap-2.5 rounded-xl border border-line bg-white p-3.5 text-xs text-ink">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <div><b className="text-navy">Tip for this round:</b> {tip}<div className="mt-1 text-muted">Look at the camera lens, sit upright, keep light in front of you. Your video never leaves this device — nothing is recorded or uploaded.</div></div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------------------------- */
export function Interview() {
  const d = useData();
  const { session } = useAuth();
  const toast = useToast();

  const [count, setCount] = useState(5);
  const [useCam, setUseCam] = useState(true);
  const [mode, setMode] = useState<Mode>('mixed');
  const [qs, setQs] = useState<InterviewQuestion[] | null>(null);
  const [i, setI] = useState(0);
  const [text, setText] = useState('');
  const [answers, setAnswers] = useState<InterviewAnswer[]>([]);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [listening, setListening] = useState(false);
  const [camOn, setCamOn] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [now, setNow] = useState(Date.now());

  const rec = useRef<SR | null>(null);
  const wantMic = useRef(false);
  const baseText = useRef('');
  const textRef = useRef('');
  const qStart = useRef(Date.now());
  const sStart = useRef(Date.now());
  textRef.current = text;
  const SRClass = getSR();

  const stopMic = useCallback(() => { wantMic.current = false; rec.current?.abort(); rec.current = null; setListening(false); }, []);
  const stopVoice = useCallback(() => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }, []);
  useEffect(() => () => { stopMic(); stopVoice(); }, [stopMic, stopVoice]);

  // ticking clock while a session is running
  useEffect(() => {
    if (!qs || finished) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [qs, finished]);

  // interviewer reads each new question aloud
  const speak = useCallback((prompt: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(prompt);
    u.lang = 'en-IN'; u.rate = 0.95;
    window.speechSynthesis.speak(u);
  }, []);
  useEffect(() => {
    if (!qs || finished) return;
    if (speakerOn) speak(qs[i].prompt); else stopVoice();
  }, [qs, i, finished, speakerOn, speak, stopVoice]);
  // per-question stopwatch restarts only when the question changes (not when the speaker is toggled)
  useEffect(() => { qStart.current = Date.now(); }, [qs, i]);

  async function start(m: Mode) {
    setMode(m); setLoading(true);
    const q = supabase.from('interview_questions').select('*');
    const { data, error } = await (d.domain?.id ? q.or(`domain_id.eq.${d.domain.id},domain_id.is.null`) : q.is('domain_id', null));
    setLoading(false);
    if (error) return toast(error.message, 'err');
    const weak = new Map(d.gaps.map((g, idx) => [g.skill.id, idx]));
    const pool = buildPool((data as InterviewQuestion[]) || [], m, count, weak);
    if (!pool.length) return toast('No interview questions available for this round yet.', 'err');
    setQs(pool); setI(0); setText(''); setAnswers([]); setFinished(false);
    setCamOn(useCam); setSpeakerOn(true);
    sStart.current = Date.now(); qStart.current = Date.now(); setNow(Date.now());
  }

  function launchMic() {
    if (!SRClass) return;
    const r = new SRClass();
    r.continuous = true; r.interimResults = true; r.lang = 'en-IN';
    baseText.current = textRef.current.trim();
    r.onresult = (e) => {
      let fin = '', interim = '';
      for (let k = 0; k < e.results.length; k++) { const res = e.results[k]; if (res.isFinal) fin += res[0].transcript + ' '; else interim += res[0].transcript; }
      setText([baseText.current, fin.trim(), interim.trim()].filter(Boolean).join(' '));
    };
    r.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { wantMic.current = false; setListening(false); toast('Microphone permission is blocked — allow it in the address bar or type your answer.', 'err'); }
    };
    r.onend = () => { if (wantMic.current) { try { launchMic(); } catch { setListening(false); } } else setListening(false); }; // Chrome stops after silence → keep going
    rec.current = r;
    r.start();
  }
  function toggleMic() {
    if (!SRClass) return toast('Voice input is not supported in this browser (use Chrome or Edge) — type your answer instead.', 'err');
    if (listening) return stopMic();
    stopVoice(); wantMic.current = true; setListening(true);
    try { launchMic(); } catch { stopMic(); }
  }

  async function next() {
    if (!qs) return;
    stopMic(); stopVoice();
    const secs = Math.max(1, Math.round((Date.now() - qStart.current) / 1000));
    const scored = [...answers, scoreAnswer(qs[i], text, secs)];
    setAnswers(scored); setText('');
    if (i < qs.length - 1) return setI(i + 1);
    setFinished(true);
    const sum = summarize(scored);
    if (session) {
      setSaving(true);
      const { error } = await supabase.from('interview_sessions').insert({ user_id: session.user.id, domain_id: d.domain?.id, track: mode, overall: sum.overall, breakdown: sum.breakdown, answers: scored });
      setSaving(false);
      if (error) toast(error.message, 'err'); else { await d.log('interview', `${modeMeta(mode).title} interview: ${sum.overall}%`, Math.round(sum.overall / 10)); d.refresh(); }
    }
  }

  function endSession() {
    if (!window.confirm('End this interview? Your answers so far will not be saved.')) return;
    stopMic(); stopVoice(); setQs(null); setFinished(false);
  }

  if (loading) return <Spinner label="Preparing your interview…" />;

  /* ------------------------------ results ------------------------------ */
  if (qs && finished) {
    const sum = summarize(answers);
    const total = answers.reduce((s, a) => s + (a.seconds ?? 0), 0);
    return (
      <div className="max-w-4xl space-y-5">
        <PageHeader title={`${modeMeta(mode).title} interview — results`} sub={`Verdict: ${sum.verdict}. Scores come from how many key concepts you covered and how clearly you structured each answer.${saving ? ' Saving…' : ''}`} />
        <div className="grid md:grid-cols-3 gap-5">
          <Card className="p-6 flex flex-col items-center gap-3 bg-navy"><Ring value={sum.overall} label="Overall" size={140} /><div className="text-[11px] text-slate-300 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {mmss(total)} answering time</div></Card>
          <Card className="md:col-span-2 p-5 space-y-4">{Object.entries(sum.breakdown).map(([k, v]) => <div key={k}><div className="flex justify-between text-[13px] mb-1.5"><span className="font-semibold text-navy">{k}</span><span className="text-muted">{v}%</span></div><Progress value={v} /></div>)}</Card>
        </div>
        {answers.map((a, idx) => {
          const star = a.track === 'behavioral' ? starParts(a.answer) : null;
          return (
            <Card key={idx} className="p-5">
              <div className="flex justify-between gap-3">
                <div><div className="mb-1.5 flex items-center gap-2"><Badge tone={toneFor(a.track ?? '')}>{trackLabel(a.track ?? 'technical')}</Badge>{a.seconds ? <span className="text-[11px] text-muted">{mmss(a.seconds)}</span> : null}</div><div className="font-bold text-navy text-sm">Q{idx + 1}. {a.prompt}</div></div>
                <Badge tone={a.score >= 70 ? 'green' : a.score >= 45 ? 'amber' : 'red'}>{a.score}%</Badge>
              </div>
              <p className="text-xs text-muted mt-2 bg-canvas rounded-lg p-3 whitespace-pre-wrap">{a.answer || '(no answer)'}</p>
              <div className="mt-3 flex flex-wrap gap-1.5 items-center"><span className="text-[11px] font-bold text-muted mr-1">Covered:</span>{a.matched.length ? a.matched.map((m) => <Badge key={m} tone="teal">{m}</Badge>) : <span className="text-[11px] text-muted">none</span>}</div>
              {a.missed.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5 items-center"><span className="text-[11px] font-bold text-muted mr-1">Consider mentioning:</span>{a.missed.map((m) => <Badge key={m} tone="amber">{m}</Badge>)}</div>}
              {star && <div className="mt-2 flex flex-wrap gap-1.5 items-center"><span className="text-[11px] font-bold text-muted mr-1">STAR:</span>{['Situation', 'Task', 'Action', 'Result'].map((p) => <Badge key={p} tone={star.found.includes(p) ? 'green' : 'red'}>{p}</Badge>)}</div>}
              {a.tips && a.tips.length > 0 && <ul className="mt-3 space-y-1">{a.tips.map((t) => <li key={t} className="text-xs text-ink flex gap-2"><Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />{t}</li>)}</ul>}
            </Card>
          );
        })}
        <div className="flex gap-3"><Btn onClick={() => start(mode)}>Practise {modeMeta(mode).title} again</Btn><Btn variant="ghost" onClick={() => { setQs(null); setFinished(false); }}>Choose another round</Btn></div>
      </div>
    );
  }

  /* ------------------------------ live session: camera + Q&A panel ------------------------------ */
  if (qs) {
    const q = qs[i];
    const meta = modeMeta(mode);
    const qSecs = Math.max(0, Math.round((now - qStart.current) / 1000));
    const totalSecs = Math.max(0, Math.round((now - sStart.current) / 1000));
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-3 gap-3">
          <div className="flex items-center gap-2.5"><span className="text-xl">{meta.icon}</span><span className="font-extrabold text-navy">{meta.title} interview</span><Badge tone={toneFor(q.track)}>{trackLabel(q.track)}</Badge></div>
          <div className="flex items-center gap-3 text-xs text-muted"><span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {mmss(totalSecs)}</span><span>Question {i + 1} of {qs.length}</span><button onClick={endSession} className="flex items-center gap-1 font-bold text-red-600 hover:text-red-700"><X className="w-4 h-4" /> End</button></div>
        </div>
        <Progress value={((i + 1) / qs.length) * 100} color="#5B2EFF" />
        <div className="grid lg:grid-cols-5 gap-5 mt-5 items-start">
          <div className="lg:col-span-3">
            <CameraPane on={camOn} onToggle={() => setCamOn((v) => !v)} speakerOn={speakerOn} onSpeaker={() => setSpeakerOn((v) => !v)} tip={meta.focus} />
          </div>
          <Card className="lg:col-span-2 p-5 fade-up" key={q.id}>
            <div className="flex items-center justify-between mb-2"><span className="text-[11px] font-bold uppercase tracking-wider text-brand">Interviewer asks</span><button onClick={() => speak(q.prompt)} className="text-xs font-bold text-muted hover:text-brand flex items-center gap-1"><Volume2 className="w-3.5 h-3.5" /> Repeat</button></div>
            <h2 className="text-[17px] font-bold text-navy leading-snug mb-4">{q.prompt}</h2>
            <textarea value={text} onChange={(e) => { if (listening) stopMic(); setText(e.target.value); }} rows={8}
              placeholder="Speak with the microphone, or type your answer here…"
              className={`w-full rounded-xl border p-3.5 text-sm text-navy outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 ${listening ? 'border-red-300 bg-red-50/30' : 'border-line'}`} />
            <div className="flex items-center justify-between mt-2 text-[11px] text-muted"><span>{listening ? <span className="text-red-600 font-bold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Listening… speak now</span> : `${words} words`}</span><span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {mmss(qSecs)} on this question</span></div>
            <div className="flex items-center justify-between mt-4 gap-2">
              <Btn variant="ghost" onClick={toggleMic}>{listening ? <><MicOff className="w-4 h-4 text-red-500" /> Stop</> : <><Mic className="w-4 h-4" /> Speak answer</>}</Btn>
              <Btn onClick={next}>{i < qs.length - 1 ? <>Next <ChevronRight className="w-4 h-4" /></> : 'Finish'}</Btn>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const bestInterview = Math.max(0, ...d.sessions.map((s) => s.overall));
  const avgInterview = d.sessions.length ? Math.round(d.sessions.reduce((a, s) => a + s.overall, 0) / d.sessions.length) : 0;
  const answered = d.sessions.reduce((a, s) => a + s.answers.length, 0);

  /* ------------------------------ choose a round ------------------------------ */
  return (
    <div className="space-y-6">
      <HeroCard eyebrow={`✦ Mock interview • ${d.domain?.name ?? ''}`} ring={d.sessions[0]?.overall ?? 0} ringLabel="Last"
        title={d.sessions.length ? `Best score so far: ${bestInterview}%` : 'Practise your first mock interview'}
        stats={[{ label: 'Sessions', value: d.sessions.length }, { label: 'Average', value: d.sessions.length ? `${avgInterview}%` : '—' }, { label: 'Answered', value: answered }]}
        actions={<button type="button" onClick={() => start('mixed')} className={heroPrimary}>Start a mixed round</button>}>
        Pick a round to start. Your camera opens beside a question panel where you can answer by voice or text. Questions favour your weakest skills.
      </HeroCard>
      <div className="grid xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-5">
          <Card className="p-5 flex flex-wrap gap-x-8 gap-y-4 items-center">
            <div><div className="text-xs font-bold text-navy mb-2">Questions per round</div><div className="flex gap-2">{[3, 5, 8].map((n) => <button key={n} onClick={() => setCount(n)} className={`text-xs font-bold px-4 py-2 rounded-lg border ${count === n ? 'bg-brand text-white border-brand' : 'bg-white border-line text-navy'}`}>{n}</button>)}</div></div>
            <label className="flex items-center gap-2.5 text-[13px] font-semibold text-navy cursor-pointer select-none"><input type="checkbox" checked={useCam} onChange={(e) => setUseCam(e.target.checked)} className="w-4 h-4 accent-[#5B2EFF]" />Open my camera (practise eye contact)</label>
          </Card>
          <div className="grid sm:grid-cols-2 gap-4">
            {MODES.map((m) => (
              <button key={m.id} onClick={() => start(m.id)} className={`text-left bg-white border border-line rounded-2xl p-5 hover:border-brand hover:shadow-lg hover:shadow-brand/10 transition group ${m.id === 'mixed' ? 'sm:col-span-2 bg-gradient-to-r from-brand-soft/70 to-white' : ''}`}>
                <div className="flex items-center justify-between"><span className="text-3xl">{m.icon}</span><span className="text-xs font-bold text-brand opacity-0 group-hover:opacity-100 transition flex items-center gap-1">Start <ChevronRight className="w-4 h-4" /></span></div>
                <div className="font-extrabold text-navy mt-2">{m.title}</div>
                <p className="text-xs text-muted mt-1 leading-relaxed">{m.blurb}</p>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted">Tip: use Chrome or Edge for voice answers. Camera and microphone need https:// or localhost, and your browser will ask permission the first time.</p>
        </div>
        <Card>
          <CardHead title="Past sessions" />
          <div className="px-5 pb-5 space-y-3">
            {d.sessions.length === 0 && <Empty title="No sessions yet" />}
            {d.sessions.slice(0, 6).map((s) => (
              <div key={s.id} className="border border-line rounded-xl p-3"><div className="flex justify-between text-[13px]"><span className="font-semibold text-navy">{trackLabel(s.track)} · {s.answers.length} Qs</span><b style={{ color: scoreColor(s.overall) }}>{s.overall}%</b></div><div className="text-[11px] text-muted">{timeAgo(s.created_at)}</div></div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}