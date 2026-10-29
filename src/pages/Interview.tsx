import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, ChevronRight } from 'lucide-react';
import { Card, CardHead, PageHeader, Btn, Badge, Progress, Empty, Ring, Spinner, timeAgo, scoreColor } from '../components/ui';
import { useData } from '../store/DataContext';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';
import { supabase } from '../lib/supabase';
import { scoreAnswer, summarize } from '../lib/interview';
import { shuffle } from '../lib/engine';
import type { InterviewAnswer, InterviewQuestion } from '../lib/types';

type Track = 'technical' | 'hr' | 'mixed';
type SR = { start: () => void; stop: () => void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null; continuous: boolean; interimResults: boolean; lang: string };

export function Interview() {
  const d = useData();
  const { session } = useAuth();
  const toast = useToast();
  const [track, setTrack] = useState<Track>('mixed');
  const [count, setCount] = useState(5);
  const [qs, setQs] = useState<InterviewQuestion[] | null>(null);
  const [i, setI] = useState(0);
  const [text, setText] = useState('');
  const [answers, setAnswers] = useState<InterviewAnswer[]>([]);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const rec = useRef<SR | null>(null);
  const SRClass = (window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR }).SpeechRecognition
    ?? (window as unknown as { webkitSpeechRecognition?: new () => SR }).webkitSpeechRecognition;

  useEffect(() => () => rec.current?.stop(), []);

  async function start() {
    setLoading(true);
    const { data, error } = await supabase.from('interview_questions').select('*').or(`domain_id.eq.${d.domain?.id},domain_id.is.null`);
    setLoading(false);
    if (error) return toast(error.message, 'err');
    const all = (data as InterviewQuestion[]) || [];
    // technical questions for the learner's weakest skills come first
    const weak = new Map(d.gaps.map((g, idx) => [g.skill.id, idx]));
    const tech = shuffle(all.filter((q) => q.track === 'technical')).sort((a, b) => (weak.get(a.skill_id ?? '') ?? 99) - (weak.get(b.skill_id ?? '') ?? 99));
    const hr = shuffle(all.filter((q) => q.track === 'hr'));
    let pool: InterviewQuestion[];
    if (track === 'technical') pool = tech; else if (track === 'hr') pool = hr;
    else { const nt = Math.ceil(count * 0.6); pool = [...tech.slice(0, nt), ...hr.slice(0, count - nt)]; }
    pool = pool.slice(0, count);
    if (!pool.length) return toast('No interview questions available.', 'err');
    setQs(pool); setI(0); setText(''); setAnswers([]); setFinished(false);
  }

  function toggleMic() {
    if (!SRClass) return toast('Voice input is not supported in this browser — type your answer.', 'err');
    if (listening) { rec.current?.stop(); return; }
    const r = new SRClass(); r.continuous = true; r.interimResults = false; r.lang = 'en-US';
    r.onresult = (e) => { let t = ''; for (let k = 0; k < e.results.length; k++) t += e.results[k][0].transcript + ' '; setText((prev) => (prev ? prev + ' ' : '') + t.trim()); };
    r.onend = () => setListening(false);
    rec.current = r; r.start(); setListening(true);
  }

  async function next() {
    if (!qs) return;
    rec.current?.stop();
    const scored = [...answers, scoreAnswer(qs[i], text)];
    setAnswers(scored); setText('');
    if (i < qs.length - 1) return setI(i + 1);
    setFinished(true);
    const sum = summarize(scored);
    if (session) {
      const { error } = await supabase.from('interview_sessions').insert({ user_id: session.user.id, domain_id: d.domain?.id, track, overall: sum.overall, breakdown: sum.breakdown, answers: scored });
      if (error) toast(error.message, 'err'); else { await d.log('interview', `Mock interview: ${sum.overall}%`, Math.round(sum.overall / 10)); d.refresh(); }
    }
  }

  if (loading) return <Spinner />;

  if (qs && finished) {
    const sum = summarize(answers);
    return (
      <div className="max-w-4xl space-y-5">
        <PageHeader title="Interview results" sub={`Verdict: ${sum.verdict}. Scores come from how many key concepts you covered and how clearly you structured the answer.`} />
        <div className="grid md:grid-cols-3 gap-5">
          <Card className="p-6 flex justify-center bg-navy"><Ring value={sum.overall} label="Overall" size={140} /></Card>
          <Card className="md:col-span-2 p-5 space-y-4">{Object.entries(sum.breakdown).map(([k, v]) => <div key={k}><div className="flex justify-between text-[13px] mb-1.5"><span className="font-semibold text-navy">{k}</span><span className="text-muted">{v}%</span></div><Progress value={v} /></div>)}</Card>
        </div>
        {answers.map((a, idx) => (
          <Card key={idx} className="p-5">
            <div className="flex justify-between gap-3"><div className="font-bold text-navy text-sm">Q{idx + 1}. {a.prompt}</div><Badge tone={a.score >= 70 ? 'green' : a.score >= 45 ? 'amber' : 'red'}>{a.score}%</Badge></div>
            <p className="text-xs text-muted mt-2 bg-canvas rounded-lg p-3 whitespace-pre-wrap">{a.answer || '(no answer)'}</p>
            <div className="mt-3 flex flex-wrap gap-1.5 items-center"><span className="text-[11px] font-bold text-muted mr-1">Covered:</span>{a.matched.length ? a.matched.map((m) => <Badge key={m} tone="teal">{m}</Badge>) : <span className="text-[11px] text-muted">none</span>}</div>
            {a.missed.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5 items-center"><span className="text-[11px] font-bold text-muted mr-1">Consider mentioning:</span>{a.missed.map((m) => <Badge key={m} tone="amber">{m}</Badge>)}</div>}
          </Card>
        ))}
        <div className="flex gap-3"><Btn onClick={() => { setQs(null); setFinished(false); }}>Practice again</Btn></div>
      </div>
    );
  }

  if (qs) {
    const q = qs[i];
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-3"><Badge tone={q.track === 'hr' ? 'amber' : 'purple'}>{q.track === 'hr' ? 'HR / Behavioural' : 'Technical'}</Badge><span className="text-xs text-muted">Question {i + 1} of {qs.length}</span></div>
        <Progress value={((i + 1) / qs.length) * 100} color="#5B2EFF" />
        <Card className="p-6 mt-5">
          <h2 className="text-lg font-bold text-navy mb-4">{q.prompt}</h2>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={9} placeholder="Type your answer, or use the microphone to dictate…"
            className="w-full rounded-xl border border-line p-3.5 text-sm text-navy outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" />
          <div className="flex items-center justify-between mt-4">
            <Btn variant="ghost" onClick={toggleMic}>{listening ? <><MicOff className="w-4 h-4 text-red-500" /> Stop</> : <><Mic className="w-4 h-4" /> Dictate</>}</Btn>
            <div className="flex items-center gap-3"><span className="text-[11px] text-muted">{text.trim() ? text.trim().split(/\s+/).length : 0} words</span><Btn onClick={next}>{i < qs.length - 1 ? <>Next <ChevronRight className="w-4 h-4" /></> : 'Finish'}</Btn></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Mock Interview" sub="Practise answering real interview questions. Technical questions are drawn from your weakest skills first." />
      <div className="grid xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 p-6">
          <h3 className="font-bold text-navy mb-4">Set up your session</h3>
          <div className="text-xs font-bold text-navy mb-2">Track</div>
          <div className="flex gap-2 mb-5">{(['mixed', 'technical', 'hr'] as Track[]).map((t) => <button key={t} onClick={() => setTrack(t)} className={`text-xs font-bold px-4 py-2 rounded-lg border capitalize ${track === t ? 'bg-brand text-white border-brand' : 'bg-white border-line text-navy'}`}>{t === 'hr' ? 'HR' : t}</button>)}</div>
          <div className="text-xs font-bold text-navy mb-2">Questions</div>
          <div className="flex gap-2 mb-6">{[3, 5, 8].map((n) => <button key={n} onClick={() => setCount(n)} className={`text-xs font-bold px-4 py-2 rounded-lg border ${count === n ? 'bg-brand text-white border-brand' : 'bg-white border-line text-navy'}`}>{n}</button>)}</div>
          <Btn onClick={start}>Start interview</Btn>
        </Card>
        <Card>
          <CardHead title="Past sessions" />
          <div className="px-5 pb-5 space-y-3">
            {d.sessions.length === 0 && <Empty title="No sessions yet" />}
            {d.sessions.slice(0, 6).map((s) => (
              <div key={s.id} className="border border-line rounded-xl p-3"><div className="flex justify-between text-[13px]"><span className="font-semibold text-navy capitalize">{s.track} · {s.answers.length} Qs</span><b style={{ color: scoreColor(s.overall) }}>{s.overall}%</b></div><div className="text-[11px] text-muted">{timeAgo(s.created_at)}</div></div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
