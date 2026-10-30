import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Timer } from 'lucide-react';
import { Card, Btn, Progress, LinkBtn, Badge, scoreColor } from '../components/ui';
import { useData } from '../store/DataContext';
import { buildAptitudeTest, type AptCategory } from '../lib/aptitude';

const CATS: AptCategory[] = ['Quantitative', 'Logical', 'Verbal', 'Data Interpretation'];

/** Common aptitude test (15 questions) — the same for every career path. */
export function Aptitude() {
  const d = useData();
  const [round, setRound] = useState(0);
  const qs = useMemo(() => buildAptitudeTest(), [round]); // eslint-disable-line react-hooks/exhaustive-deps
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => qs.map(() => null));
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const saved = useRef(false);

  // stopwatch: runs until the test is submitted, and is cleaned up when you leave the page
  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [done, round]);

  const correct = answers.filter((a, k) => a === qs[k].correct).length;
  const pct = Math.round((correct / qs.length) * 100);
  const answered = answers.filter((a) => a !== null).length;

  async function finish() {
    setDone(true);
    if (saved.current) return;
    saved.current = true;
    await d.log('aptitude', `Aptitude test: ${correct}/${qs.length}`, Math.round(pct / 10));
    await d.refresh();
  }
  function retake() {
    saved.current = false;
    setRound((r) => r + 1); setI(0); setDone(false); setElapsed(0);
    setAnswers(Array(qs.length).fill(null));
  }

  if (done) {
    const by = CATS.map((c) => { const idx = qs.map((q, k) => (q.cat === c ? k : -1)).filter((k) => k >= 0); const ok = idx.filter((k) => answers[k] === qs[k].correct).length; return { c, ok, n: idx.length }; });
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <Card className="p-8 text-center">
          <div className="text-5xl mb-2">{pct >= 70 ? '🎉' : pct >= 40 ? '👍' : '💪'}</div>
          <h1 className="text-2xl font-extrabold text-navy">Aptitude test: {pct}%</h1>
          <p className="text-sm text-muted mt-1">{correct} of {qs.length} correct in {Math.floor(elapsed / 60)}m {elapsed % 60}s</p>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 mt-6 text-left">
            {by.map((b) => <div key={b.c}><div className="flex justify-between text-[13px] mb-1"><span className="font-semibold text-navy">{b.c}</span><span className="text-muted">{b.ok}/{b.n}</span></div><Progress value={b.n ? (b.ok / b.n) * 100 : 0} color={scoreColor(b.n ? (b.ok / b.n) * 100 : 0)} /></div>)}
          </div>
          <div className="flex justify-center gap-3 mt-6"><LinkBtn to="/assessments" variant="ghost">All assessments</LinkBtn><Btn onClick={retake}>Try a new set</Btn></div>
        </Card>
        {qs.map((q, k) => {
          const ok = answers[k] === q.correct;
          return (
            <Card key={q.id} className="p-5">
              <div className="flex gap-3">
                {ok ? <CheckCircle2 className="w-5 h-5 text-teal shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
                <div className="text-sm">
                  <Badge tone="purple">{q.cat}</Badge>
                  <div className="font-bold text-navy mt-1.5">{q.prompt}</div>
                  <div className="text-xs mt-2 text-muted">Your answer: <span className={ok ? 'text-teal font-bold' : 'text-red-600 font-bold'}>{answers[k] === null ? 'Skipped' : q.options[answers[k]!]}</span></div>
                  {!ok && <div className="text-xs mt-1 text-muted">Correct: <b className="text-teal">{q.options[q.correct]}</b></div>}
                  <div className="text-xs mt-2 text-navy bg-canvas rounded-lg p-2.5">{q.explanation}</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  const q = qs[i];
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div><div className="text-xs font-bold text-brand uppercase tracking-wider">Aptitude test · all career paths</div><div className="text-sm text-muted">Question {i + 1} of {qs.length} · {q.cat} · {answered} answered</div></div>
        <div className="flex items-center gap-1.5 text-sm font-bold text-navy bg-white border border-line rounded-lg px-3 py-1.5"><Timer className="w-4 h-4 text-brand" />{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</div>
      </div>
      <Progress value={((i + 1) / qs.length) * 100} color="#5B2EFF" />
      <Card className="p-6 mt-5">
        <h2 className="text-lg font-bold text-navy mb-5">{q.prompt}</h2>
        <div className="space-y-3">
          {q.options.map((o, idx) => (
            <button key={idx} onClick={() => setAnswers(answers.map((a, k) => (k === i ? idx : a)))}
              className={`w-full text-left rounded-xl border px-4 py-3 text-sm font-medium transition ${answers[i] === idx ? 'border-brand bg-brand-soft text-brand' : 'border-line text-navy hover:border-brand/50'}`}>
              <span className="inline-block w-6 font-bold">{String.fromCharCode(65 + idx)}.</span>{o}
            </button>
          ))}
        </div>
      </Card>
      <div className="flex items-center justify-between mt-5">
        <Btn variant="ghost" disabled={i === 0} onClick={() => setI(i - 1)}>Previous</Btn>
        <div className="hidden sm:flex gap-1.5 flex-wrap justify-center">{qs.map((_, k) => <button key={k} onClick={() => setI(k)} className={`w-7 h-7 rounded-md text-[11px] font-bold ${k === i ? 'bg-brand text-white' : answers[k] !== null ? 'bg-teal-soft text-teal' : 'bg-white border border-line text-muted'}`}>{k + 1}</button>)}</div>
        {i < qs.length - 1 ? <Btn onClick={() => setI(i + 1)}>Next</Btn> : <Btn variant="teal" onClick={finish}>Submit</Btn>}
      </div>
      <p className="text-center text-[11px] text-muted mt-4"><Link to="/assessments" className="font-bold text-brand">Leave test</Link> · unanswered questions count as wrong</p>
    </div>
  );
}
