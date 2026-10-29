import type { InterviewAnswer, InterviewQuestion } from './types';

const STAR = ['situation', 'task', 'action', 'result', 'because', 'learned', 'team', 'outcome', 'improved', 'impact'];

/** Scores an answer by how many key concepts it covers plus clarity (length & structure). */
export function scoreAnswer(q: InterviewQuestion, answer: string): InterviewAnswer {
  const text = answer.toLowerCase();
  const matched = q.key_points.filter((k) => {
    const stem = k.toLowerCase().replace(/(ing|ed|es|s)$/,'');
    return text.includes(k.toLowerCase()) || (stem.length > 3 && text.includes(stem));
  });
  const missed = q.key_points.filter((k) => !matched.includes(k));
  const coverage = q.key_points.length ? (matched.length / q.key_points.length) * 100 : 0;

  const words = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const sentences = answer.split(/[.!?]+/).filter((s) => s.trim().length > 3).length;
  const lengthScore = words === 0 ? 0 : words < 20 ? 25 : words < 40 ? 55 : words <= 220 ? 100 : 80;
  const structure = Math.min(100, sentences * 20 + (q.track === 'hr' ? STAR.filter((w) => text.includes(w)).length * 8 : 0));
  const clarity = Math.round(lengthScore * 0.6 + Math.min(structure, 100) * 0.4);

  const score = words === 0 ? 0 : Math.round(coverage * 0.65 + clarity * 0.35);
  return { question_id: q.id, prompt: q.prompt, answer, coverage: Math.round(coverage), matched, missed, clarity, score };
}

export function summarize(answers: InterviewAnswer[]) {
  const n = answers.length || 1;
  const avg = (f: (a: InterviewAnswer) => number) => Math.round(answers.reduce((s, a) => s + f(a), 0) / n);
  const overall = avg((a) => a.score);
  return {
    overall,
    breakdown: { 'Concept coverage': avg((a) => a.coverage), 'Clarity': avg((a) => a.clarity), 'Overall': overall },
    verdict: overall >= 75 ? 'Excellent' : overall >= 55 ? 'Good' : 'Needs practice',
  };
}
