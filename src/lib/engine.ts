/**
 * Business logic: everything the UI shows about a student is computed here
 * from real evidence (quiz/coding attempts, learning, projects, resume, claims).
 */
import type {
  Skill, Question, QuizAttempt, CodingAttempt, CodingChallenge, Resource, Project, ProjectProgress,
  SkillClaim, ResumeAnalysis, Job, JobAction, InterviewSession, Activity,
} from './types';

export const TARGET = 70;          // score at which a skill counts as "job ready"
export const UNVERIFIED_CAP = 60;  // can't exceed this without a quiz or coding attempt

export interface Evidence {
  quizzes: QuizAttempt[];
  coding: CodingAttempt[];
  challenges: CodingChallenge[];
  resources: Resource[];
  completedResourceIds: Set<string>;
  projects: Project[];
  projectProgress: ProjectProgress[];
  claims: SkillClaim[];
  latestResume: ResumeAnalysis | null;
}

export interface SkillScore {
  skill: Skill;
  score: number;
  verified: boolean;
  quizAttempts: number;
  parts: { quiz?: number; coding?: number; learning?: number; project?: number; claim?: number };
}

const W = { quiz: 50, coding: 20, learning: 15, project: 15, claim: 15 };

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function computeSkillScores(skills: Skill[], ev: Evidence): Record<string, SkillScore> {
  const out: Record<string, SkillScore> = {};
  for (const skill of skills) {
    const parts: SkillScore['parts'] = {};

    // Quiz: mean % of the latest 3 attempts (recent performance matters most)
    const qa = ev.quizzes.filter((q) => q.skill_id === skill.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    if (qa.length) parts.quiz = avg(qa.slice(0, 3).map((q) => (q.total ? (q.correct / q.total) * 100 : 0)));

    // Coding: best pass-rate per challenge, averaged
    const chs = ev.challenges.filter((c) => c.skill_id === skill.id);
    const best = chs.map((c) => {
      const attempts = ev.coding.filter((a) => a.challenge_id === c.id);
      return attempts.length ? Math.max(...attempts.map((a) => (a.total ? (a.passed / a.total) * 100 : 0))) : null;
    }).filter((x): x is number => x !== null);
    if (best.length) parts.coding = avg(best);

    // Learning: share of this skill's resources completed
    const res = ev.resources.filter((r) => r.skill_id === skill.id);
    const done = res.filter((r) => ev.completedResourceIds.has(r.id)).length;
    if (res.length && done > 0) parts.learning = (done / res.length) * 100;

    // Projects: average requirement completion of projects that exercise this skill
    const prs = ev.projects.filter((p) => p.skill_slugs.includes(skill.slug));
    const fr = prs.map((p) => {
      const pp = ev.projectProgress.find((x) => x.project_id === p.id);
      return pp && p.requirements.length ? (pp.done_requirements.length / p.requirements.length) * 100 : 0;
    }).filter((x) => x > 0);
    if (fr.length) parts.project = avg(fr);

    // Claim: self-declared level, or detection in the latest resume
    const claim = ev.claims.find((c) => c.skill_id === skill.id);
    const claimScore = claim ? [0, 35, 55, 75][claim.level] : 0;
    const resumeScore = ev.latestResume?.detected_skill_ids.includes(skill.id) ? 45 : 0;
    const c = Math.max(claimScore, resumeScore);
    if (c > 0) parts.claim = c;

    let num = 0, den = 0;
    (Object.keys(parts) as (keyof typeof parts)[]).forEach((k) => {
      num += (parts[k] as number) * W[k];
      den += W[k];
    });
    let score = den ? num / den : 0;
    const verified = parts.quiz !== undefined || parts.coding !== undefined;
    if (!verified) score = Math.min(score, UNVERIFIED_CAP);
    out[skill.id] = { skill, score: Math.round(score), verified, quizAttempts: qa.length, parts };
  }
  return out;
}

/** Weighted readiness (0-100): each skill contributes min(score/TARGET, 1) × weight. */
export function computeReadiness(scores: Record<string, SkillScore>): number {
  const list = Object.values(scores);
  const total = list.reduce((a, s) => a + s.skill.weight, 0);
  if (!total) return 0;
  const got = list.reduce((a, s) => a + s.skill.weight * Math.min(s.score / TARGET, 1), 0);
  return Math.round((got / total) * 100);
}

export interface Gap { skill: Skill; score: number; gap: number; priority: 'High' | 'Medium' | 'Low'; verified: boolean }

export function computeGaps(scores: Record<string, SkillScore>): Gap[] {
  return Object.values(scores)
    .map((s) => {
      const gap = Math.max(0, TARGET - s.score);
      const priority: Gap['priority'] = gap >= 40 ? 'High' : gap >= 20 ? 'Medium' : 'Low';
      return { skill: s.skill, score: s.score, gap, priority, verified: s.verified };
    })
    .filter((g) => g.gap > 0)
    .sort((a, b) => b.gap * b.skill.weight - a.gap * a.skill.weight);
}

export const levelLabel = (score: number) => (score >= 85 ? 'Expert' : score >= 70 ? 'Advanced' : score >= 45 ? 'Intermediate' : score > 0 ? 'Beginner' : 'Not started');
export const statusOf = (score: number): 'Strong' | 'Moderate' | 'Weak' => (score >= TARGET ? 'Strong' : score >= 45 ? 'Moderate' : 'Weak');

// ---- Roadmap ---------------------------------------------------------------
export interface RoadmapStep {
  tier: number; title: string; blurb: string; progress: number;
  status: 'Completed' | 'In Progress' | 'Not Started'; skills: SkillScore[];
}
const TIER_META: Record<number, { title: string; blurb: string }> = {
  1: { title: 'Foundations', blurb: 'Core concepts every role in this path relies on.' },
  2: { title: 'Core Skills', blurb: 'The practical, job-defining toolset.' },
  3: { title: 'Advanced & Specialisation', blurb: 'Depth that separates strong candidates.' },
};
export function computeRoadmap(scores: Record<string, SkillScore>): RoadmapStep[] {
  const tiers = [...new Set(Object.values(scores).map((s) => s.skill.tier))].sort();
  return tiers.map((tier) => {
    const skills = Object.values(scores).filter((s) => s.skill.tier === tier).sort((a, b) => b.skill.weight - a.skill.weight);
    const progress = Math.round(avg(skills.map((s) => Math.min(s.score / TARGET, 1))) * 100);
    const status = progress >= 95 ? 'Completed' : progress > 0 ? 'In Progress' : 'Not Started';
    return { tier, ...TIER_META[tier], progress, status, skills };
  });
}

// ---- Jobs ------------------------------------------------------------------
export interface JobMatch { job: Job; match: number; matched: Skill[]; missing: Skill[]; status?: JobAction['status'] }
export function matchJobs(jobs: Job[], skills: Skill[], scores: Record<string, SkillScore>, actions: JobAction[]): JobMatch[] {
  const bySlug = new Map(skills.map((s) => [s.slug, s]));
  return jobs.map((job) => {
    const req = job.required_skills.map((slug) => bySlug.get(slug)).filter((s): s is Skill => !!s);
    const parts = req.map((s) => Math.min((scores[s.id]?.score ?? 0) / TARGET, 1));
    const match = req.length ? Math.round(avg(parts) * 100) : 0;
    const matched = req.filter((s) => (scores[s.id]?.score ?? 0) >= 60);
    const missing = req.filter((s) => (scores[s.id]?.score ?? 0) < 60);
    return { job, match, matched, missing, status: actions.find((a) => a.job_id === job.id)?.status };
  }).sort((a, b) => b.match - a.match);
}
export const matchLabel = (m: number) => (m >= 85 ? 'Top Match' : m >= 65 ? 'High Match' : m >= 40 ? 'Good Match' : 'Stretch');

// ---- Streaks & activity ----------------------------------------------------
export const dayKey = (d: Date | string) => {
  const x = typeof d === 'string' ? new Date(d) : d;
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
export function computeStreak(activity: Activity[]): { current: number; best: number } {
  const days = new Set(activity.map((a) => dayKey(a.created_at)));
  let current = 0;
  const cur = new Date();
  if (!days.has(dayKey(cur))) cur.setDate(cur.getDate() - 1); // today not yet counted
  while (days.has(dayKey(cur))) { current++; cur.setDate(cur.getDate() - 1); }
  const sorted = [...days].sort();
  let best = 0, run = 0, prev: Date | null = null;
  for (const k of sorted) {
    const d = new Date(k + 'T00:00:00');
    run = prev && Math.round((d.getTime() - prev.getTime()) / 86400000) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return { current, best };
}

// ---- Next best actions (the "coach") ---------------------------------------
export interface NextAction { id: string; title: string; why: string; to: string; cta: string }
export function nextActions(args: {
  scores: Record<string, SkillScore>; gaps: Gap[]; hasResume: boolean; sessions: InterviewSession[];
  resources: Resource[]; completed: Set<string>; projects: Project[]; progress: ProjectProgress[]; readiness: number;
}): NextAction[] {
  const { scores, gaps, hasResume, sessions, resources, completed, projects, progress, readiness } = args;
  const out: NextAction[] = [];
  if (!hasResume) out.push({ id: 'resume', title: 'Analyze your resume', why: 'Detects the skills you already have and scores ATS readiness.', to: '/resume', cta: 'Upload resume' });
  const unverified = Object.values(scores).filter((s) => !s.verified).sort((a, b) => b.skill.weight - a.skill.weight);
  if (unverified[0]) out.push({ id: 'verify-' + unverified[0].skill.id, title: `Verify ${unverified[0].skill.name}`, why: `Not tested yet — ${unverified.length} skill${unverified.length > 1 ? 's' : ''} still unverified.`, to: `/assessments/quiz/${unverified[0].skill.id}`, cta: 'Take quiz' });
  const g = gaps.find((x) => x.verified);
  if (g) {
    const next = resources.find((r) => r.skill_id === g.skill.id && !completed.has(r.id));
    if (next) out.push({ id: 'learn-' + g.skill.id, title: `Study ${g.skill.name}: ${next.title}`, why: `${g.gap} points below the job-ready target.`, to: '/learning', cta: 'Open resources' });
  }
  if (!sessions.length) out.push({ id: 'interview', title: 'Practice a mock interview', why: 'Get scored on how well you cover key concepts.', to: '/interview', cta: 'Start interview' });
  const topSlugs = new Set(gaps.slice(0, 3).map((x) => x.skill.slug));
  const proj = projects.find((p) => p.skill_slugs.some((s) => topSlugs.has(s)) && !progress.find((x) => x.project_id === p.id));
  if (proj) out.push({ id: 'proj-' + proj.id, title: `Build: ${proj.title}`, why: 'Exercises your biggest gaps and adds portfolio proof.', to: `/projects/${proj.id}`, cta: 'View project' });
  if (readiness >= 70) out.push({ id: 'jobs', title: 'Start applying', why: `You are ${readiness}% ready — your best matches are waiting.`, to: '/jobs', cta: 'See matches' });
  return out.slice(0, 4);
}

// ---- Quiz helpers -----------------------------------------------------------
export function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export function pickQuestions(all: Question[], n = 10): Question[] { return shuffle(all).slice(0, n); }
