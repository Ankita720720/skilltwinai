import type { InterviewAnswer, InterviewQuestion, InterviewTrack } from './types';

export type Mode = InterviewTrack | 'mixed';

export const MODES: { id: Mode; title: string; icon: string; blurb: string; focus: string }[] = [
  { id: 'technical', title: 'Technical', icon: '🛠️', blurb: 'Concept and problem questions from your own career path, weakest skills first.', focus: 'Be precise: define, explain how it works, give an example.' },
  { id: 'behavioral', title: 'Behavioral', icon: '🧠', blurb: '“Tell me about a time…” questions answered with the STAR method.', focus: 'Use Situation → Task → Action → Result, and say what you learned.' },
  { id: 'hr', title: 'HR Round', icon: '🤝', blurb: 'Introduction, strengths, weaknesses, goals, salary, relocation and culture fit.', focus: 'Be honest, specific and positive. Link your answer to the role.' },
  { id: 'situational', title: 'Situational', icon: '🧩', blurb: '“What would you do if…” scenarios that test judgement and priorities.', focus: 'Think aloud: clarify, list options, choose one, explain the trade-off.' },
  { id: 'mixed', title: 'Full Mock', icon: '🎯', blurb: 'A realistic mix of all four rounds, just like a campus placement drive.', focus: 'Switch gears between rounds and keep every answer structured.' },
];
export const modeMeta = (m: string) => MODES.find((x) => x.id === m) ?? MODES[0];
export const trackLabel = (t: string) => ({ technical: 'Technical', behavioral: 'Behavioral', hr: 'HR', situational: 'Situational', mixed: 'Full mock' } as Record<string, string>)[t] ?? t;

const STAR_WORDS: Record<string, string[]> = {
  Situation: ['situation', 'context', 'when i was', 'during', 'at that time', 'our team', 'in my project', 'in my internship'],
  Task: ['task', 'goal', 'responsible', 'my role', 'objective', 'needed to', 'had to'],
  Action: ['i decided', 'i built', 'i created', 'i led', 'i started', 'i organised', 'i organized', 'i implemented', 'i worked', 'i took', 'i designed', 'i analysed', 'i analyzed', 'action'],
  Result: ['result', 'outcome', 'achieved', 'improved', 'reduced', 'increased', 'delivered', 'finally', 'successfully', 'learned', 'learnt', 'impact'],
};
const FILLERS = ['um', 'uh', 'erm', 'basically', 'actually', 'you know', 'like', 'kind of', 'sort of', 'i mean'];

const countFillers = (text: string) => FILLERS.reduce((n, f) => n + (text.match(new RegExp(`\\b${f}\\b`, 'g'))?.length ?? 0), 0);

export function starParts(answer: string) {
  const t = answer.toLowerCase();
  const found = Object.entries(STAR_WORDS).filter(([, ws]) => ws.some((w) => t.includes(w))).map(([k]) => k);
  return { found, missing: Object.keys(STAR_WORDS).filter((k) => !found.includes(k)) };
}

/** Scores an answer: key-concept coverage (65%) + clarity (35%). Behavioral/HR/situational answers also get a STAR-structure check. */
export function scoreAnswer(q: InterviewQuestion, answer: string, seconds = 0): InterviewAnswer {
  const text = answer.toLowerCase();
  const matched = q.key_points.filter((k) => {
    const stem = k.toLowerCase().replace(/(ing|ed|es|s)$/, '');
    return text.includes(k.toLowerCase()) || (stem.length > 3 && text.includes(stem));
  });
  const missed = q.key_points.filter((k) => !matched.includes(k));
  const coverage = q.key_points.length ? (matched.length / q.key_points.length) * 100 : 0;

  const words = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const sentences = answer.split(/[.!?]+/).filter((s) => s.trim().length > 3).length;
  const lengthScore = words === 0 ? 0 : words < 20 ? 25 : words < 40 ? 55 : words <= 220 ? 100 : 80;
  const star = starParts(answer);
  const starPct = Math.round((star.found.length / 4) * 100);
  const wantsStar = q.track === 'behavioral' || q.track === 'hr' || q.track === 'situational';
  const structure = Math.min(100, sentences * 20 + (wantsStar ? star.found.length * 10 : 0));
  const clarity = Math.round(lengthScore * 0.6 + structure * 0.4);
  const fillers = countFillers(text);

  const tips: string[] = [];
  if (words === 0) tips.push('You skipped this question — even a short attempt earns more than silence.');
  else {
    if (words < 40) tips.push('Aim for 60–150 words (about 30–60 seconds) so you cover the idea properly.');
    if (words > 220) tips.push('This ran long. Lead with the key point, then support it with one example.');
    if (q.track === 'behavioral' && star.missing.length) tips.push(`Add the missing STAR part${star.missing.length > 1 ? 's' : ''}: ${star.missing.join(', ')}.`);
    if (q.track === 'situational' && !/(first|then|because|would|prioriti)/.test(text)) tips.push('Show your reasoning: say what you would do first, then, and why.');
    if (q.track === 'hr' && !/(role|company|team|goal|learn|grow)/.test(text)) tips.push('Connect your answer to the role or company to sound motivated.');
    if (q.track === 'technical' && missed.length >= Math.ceil(q.key_points.length / 2)) tips.push('Name the core terms of the topic and add a small real example.');
    if (fillers >= 4) tips.push(`You used ${fillers} filler words (like “basically”, “actually”). Pause instead.`);
    if (seconds > 0 && words / (seconds / 60) > 190) tips.push('You spoke very fast — slow down so the interviewer can follow.');
  }
  if (words > 0 && !tips.length) tips.push('Well structured. Try adding a concrete number or result to make it memorable.');

  const score = words === 0 ? 0 : Math.round(coverage * 0.65 + clarity * 0.35);
  return { question_id: q.id, prompt: q.prompt, answer, coverage: Math.round(coverage), matched, missed, clarity, score, track: q.track, tips, seconds, fillers, star: starPct };
}

export function summarize(answers: InterviewAnswer[]) {
  const n = answers.length || 1;
  const avg = (f: (a: InterviewAnswer) => number) => Math.round(answers.reduce((s, a) => s + f(a), 0) / n);
  const overall = avg((a) => a.score);
  const breakdown: Record<string, number> = { 'Concept coverage': avg((a) => a.coverage), 'Clarity': avg((a) => a.clarity) };
  (['technical', 'behavioral', 'hr', 'situational'] as InterviewTrack[]).forEach((t) => {
    const xs = answers.filter((a) => a.track === t);
    if (xs.length) breakdown[trackLabel(t)] = Math.round(xs.reduce((s, a) => s + a.score, 0) / xs.length);
  });
  breakdown['Overall'] = overall;
  return { overall, breakdown, verdict: overall >= 75 ? 'Excellent' : overall >= 55 ? 'Good' : 'Needs practice' };
}