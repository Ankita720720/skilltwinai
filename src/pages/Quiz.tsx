import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Timer } from 'lucide-react';
import { Card, Btn, Spinner, Progress, LinkBtn } from '../components/ui';
import { useData } from '../store/DataContext';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';
import { supabase } from '../lib/supabase';
import { pickQuestions } from '../lib/engine';
import type { Question } from '../lib/types';

export function Quiz() {
  const { skillId } = useParams();
  const d = useData();
  const { session } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const skill = d.skills.find((s) => s.id === skillId);
  const [qs, setQs] = useState<Question[] | null>(null);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const saved = useRef(false);

  useEffect(() => {
    if (!skillId) return;
    supabase.from('questions').select('*').eq('skill_id', skillId).then(({ data, error }) => {
      if (error) { toast(error.message, 'err'); return; }
      const picked = pickQuestions((data as Question[]) || [], 10);
      setQs(picked); setAnswers(picked.map(() => null));
    });
  }, [skillId]);

  useEffect(() => {
    if (done || !qs) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [done, qs]);

  if (!skill) return <p className="text-sm text-muted">Skill not found. <Link to="/assessments" className="text-brand font-bold">Back</Link></p>;
  if (!qs) return <Spinner label="Preparing questions…" />;
  if (qs.length === 0) return <p className="text-sm text-muted">No questions for this skill yet.</p>;

  const correct = answers.filter((a, idx) => a === qs[idx].correct_index).length;
  const pct = Math.round((correct / qs.length) * 100);

  async function finish() {
    setDone(true);
    if (saved.current || !session || !qs) return;
    saved.current = true;
    const { error } = await supabase.from('quiz_attempts').insert({
      user_id: session.user.id, skill_id: skill!.id, total: qs.length, correct, duration_sec: elapsed,
      answers: qs.map((q, idx) => ({ q: q.id, chosen: answers[idx], ok: answers[idx] === q.correct_index })),
    });
    if (error) return toast(error.message, 'err');
    await d.log('quiz', `${skill!.name} quiz: ${correct}/${qs.length}`, Math.round(pct / 10));
    await d.refresh();
  }

  if (done) {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <Card className="p-8 text-center">
          <div className="text-5xl mb-2">{pct >= 70 ? '🎉' : pct >= 40 ? '👍' : '💪'}</div>
          <h1 className="text-2xl font-extrabold text-navy">{skill.name}: {pct}%</h1>
          <p className="text-sm text-muted mt-1">{correct} of {qs.length} correct in {Math.floor(elapsed / 60)}m {elapsed % 60}s</p>
          <div className="text-sm mt-3 text-navy">Your {skill.name} score is now <b>{d.scores[skill.id]?.score ?? 0}%</b>.</div>
          <div className="flex justify-center gap-3 mt-5"><LinkBtn to="/assessments" variant="ghost">All assessments</LinkBtn><Btn onClick={() => nav(0)}>Retake</Btn></div>
        </Card>
        {qs.map((q, idx) => {
          const ok = answers[idx] === q.correct_index;
          return (
            <Card key={q.id} className="p-5">
              <div className="flex gap-3">
                {ok ? <CheckCircle2 className="w-5 h-5 text-teal shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
                <div className="text-sm">
                  <div className="font-bold text-navy">{q.prompt}</div>
                  <div className="text-xs mt-2 text-muted">Your answer: <span className={ok ? 'text-teal font-bold' : 'text-red-600 font-bold'}>{answers[idx] === null ? 'Skipped' : q.options[answers[idx]!]}</span></div>
                  {!ok && <div className="text-xs mt-1 text-muted">Correct: <b className="text-teal">{q.options[q.correct_index]}</b></div>}
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
        <div><div className="text-xs font-bold text-brand uppercase tracking-wider">{skill.name} assessment</div><div className="text-sm text-muted">Question {i + 1} of {qs.length}</div></div>
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
        <div className="hidden sm:flex gap-1.5">{qs.map((_, k) => <button key={k} onClick={() => setI(k)} className={`w-7 h-7 rounded-md text-[11px] font-bold ${k === i ? 'bg-brand text-white' : answers[k] !== null ? 'bg-teal-soft text-teal' : 'bg-white border border-line text-muted'}`}>{k + 1}</button>)}</div>
        {i < qs.length - 1 ? <Btn onClick={() => setI(i + 1)}>Next</Btn> : <Btn variant="teal" onClick={finish}>Submit</Btn>}
      </div>
    </div>
  );
}
