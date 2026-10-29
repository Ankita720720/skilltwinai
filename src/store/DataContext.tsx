import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type {
  Skill, Resource, Project, Job, CodingChallenge, Domain, QuizAttempt, CodingAttempt, ResumeAnalysis,
  ProjectProgress, JobAction, InterviewSession, Goal, Activity, SkillClaim,
} from '../lib/types';
import {
  computeSkillScores, computeReadiness, computeGaps, computeRoadmap, matchJobs, computeStreak, nextActions,
  type SkillScore, type Gap, type RoadmapStep, type JobMatch, type NextAction,
} from '../lib/engine';

interface DataState {
  loading: boolean;
  domains: Domain[];
  domain: Domain | null;
  skills: Skill[];
  resources: Resource[];
  projects: Project[];
  jobs: Job[];
  challenges: CodingChallenge[];
  questionCounts: Record<string, number>;
  quizzes: QuizAttempt[];
  coding: CodingAttempt[];
  resumes: ResumeAnalysis[];
  projectProgress: ProjectProgress[];
  jobActions: JobAction[];
  sessions: InterviewSession[];
  goals: Goal[];
  activity: Activity[];
  claims: SkillClaim[];
  completedResourceIds: Set<string>;
  // derived
  scores: Record<string, SkillScore>;
  readiness: number;
  gaps: Gap[];
  roadmap: RoadmapStep[];
  jobMatches: JobMatch[];
  streak: { current: number; best: number };
  actions: NextAction[];
  refresh: () => Promise<void>;
  log: (kind: string, label: string, points?: number) => Promise<void>;
}

const Ctx = createContext<DataState>(null as unknown as DataState);
export const useData = () => useContext(Ctx);

const empty = { quizzes: [], coding: [], resumes: [], projectProgress: [], jobActions: [], sessions: [], goals: [], activity: [], claims: [] };

export function DataProvider({ children }: { children: ReactNode }) {
  const { session, profile } = useAuth();
  const uid = session?.user.id;
  const domainId = profile?.domain_id ?? null;

  const [loading, setLoading] = useState(true);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [challenges, setChallenges] = useState<CodingChallenge[]>([]);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  const [u, setU] = useState<{
    quizzes: QuizAttempt[]; coding: CodingAttempt[]; resumes: ResumeAnalysis[]; projectProgress: ProjectProgress[];
    jobActions: JobAction[]; sessions: InterviewSession[]; goals: Goal[]; activity: Activity[]; claims: SkillClaim[];
  }>(empty);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!uid) { setLoading(false); return; }
    const d = await supabase.from('domains').select('*').order('sort_order');
    setDomains((d.data as Domain[]) || []);

    let skillList: Skill[] = [];
    if (domainId) {
      const sk = await supabase.from('skills').select('*').eq('domain_id', domainId).order('tier').order('weight', { ascending: false });
      skillList = (sk.data as Skill[]) || [];
      const ids = skillList.map((s) => s.id);
      const [res, pr, jb, ch, qs] = await Promise.all([
        supabase.from('resources').select('*').in('skill_id', ids),
        supabase.from('projects').select('*').eq('domain_id', domainId),
        supabase.from('jobs').select('*').eq('domain_id', domainId).order('posted_at', { ascending: false }),
        supabase.from('coding_challenges').select('*').eq('domain_id', domainId),
        supabase.from('questions').select('skill_id').in('skill_id', ids),
      ]);
      setResources((res.data as Resource[]) || []);
      setProjects((pr.data as Project[]) || []);
      setJobs((jb.data as Job[]) || []);
      setChallenges((ch.data as CodingChallenge[]) || []);
      const counts: Record<string, number> = {};
      ((qs.data as { skill_id: string }[]) || []).forEach((r) => { counts[r.skill_id] = (counts[r.skill_id] || 0) + 1; });
      setQuestionCounts(counts);
    } else {
      setResources([]); setProjects([]); setJobs([]); setChallenges([]); setQuestionCounts({});
    }
    setSkills(skillList);

    const [qa, ca, rs, pp, ja, is, gl, ac, cl, rp] = await Promise.all([
      supabase.from('quiz_attempts').select('*').order('created_at', { ascending: false }),
      supabase.from('coding_attempts').select('*').order('created_at', { ascending: false }),
      supabase.from('resume_analyses').select('*').order('created_at', { ascending: false }),
      supabase.from('project_progress').select('*'),
      supabase.from('job_actions').select('*'),
      supabase.from('interview_sessions').select('*').order('created_at', { ascending: false }),
      supabase.from('goals').select('*').order('created_at', { ascending: false }),
      supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('skill_claims').select('*'),
      supabase.from('resource_progress').select('resource_id'),
    ]);
    setU({
      quizzes: (qa.data as QuizAttempt[]) || [], coding: (ca.data as CodingAttempt[]) || [], resumes: (rs.data as ResumeAnalysis[]) || [],
      projectProgress: (pp.data as ProjectProgress[]) || [], jobActions: (ja.data as JobAction[]) || [], sessions: (is.data as InterviewSession[]) || [],
      goals: (gl.data as Goal[]) || [], activity: (ac.data as Activity[]) || [], claims: (cl.data as SkillClaim[]) || [],
    });
    setCompleted(new Set(((rp.data as { resource_id: string }[]) || []).map((r) => r.resource_id)));
    setLoading(false);
  }, [uid, domainId]);

  useEffect(() => { setLoading(true); refresh(); }, [refresh]);

  const log = useCallback(async (kind: string, label: string, points = 0) => {
    if (!uid) return;
    await supabase.from('activity_log').insert({ user_id: uid, kind, label, points });
  }, [uid]);

  const derived = useMemo(() => {
    const scores = computeSkillScores(skills, {
      quizzes: u.quizzes, coding: u.coding, challenges, resources, completedResourceIds: completed,
      projects, projectProgress: u.projectProgress, claims: u.claims, latestResume: u.resumes[0] ?? null,
    });
    const readiness = computeReadiness(scores);
    const gaps = computeGaps(scores);
    const roadmap = computeRoadmap(scores);
    const jobMatches = matchJobs(jobs, skills, scores, u.jobActions);
    const streak = computeStreak(u.activity);
    const actions = nextActions({ scores, gaps, hasResume: u.resumes.length > 0, sessions: u.sessions, resources, completed, projects, progress: u.projectProgress, readiness });
    return { scores, readiness, gaps, roadmap, jobMatches, streak, actions };
  }, [skills, u, challenges, resources, completed, projects, jobs]);

  const domain = domains.find((x) => x.id === domainId) ?? null;

  const value: DataState = {
    loading, domains, domain, skills, resources, projects, jobs, challenges, questionCounts,
    ...u, completedResourceIds: completed, ...derived, refresh, log,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
