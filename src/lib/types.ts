export interface Domain { id: string; name: string; icon: string; role_title: string; description: string; avg_salary: string | null; sort_order: number }
export interface Skill { id: string; domain_id: string; slug: string; name: string; weight: number; tier: number; description: string; keywords: string[] }
export interface Question { id: string; skill_id: string; prompt: string; options: string[]; correct_index: number; difficulty: string; explanation: string }
export interface CodingChallenge { id: string; domain_id: string; skill_id: string | null; title: string; prompt: string; fn_name: string; starter_code: string; tests: { args: unknown[]; expected: unknown }[]; difficulty: string }
export interface Resource { id: string; skill_id: string; title: string; url: string; kind: string; provider: string; minutes: number }
export interface Project { id: string; domain_id: string; title: string; summary: string; difficulty: string; est_hours: number; skill_slugs: string[]; requirements: string[] }
export interface Job { id: string; domain_id: string; title: string; company: string; location: string; work_type: string; level: string; salary: string | null; required_skills: string[]; description: string; apply_url: string | null; posted_at: string }
export interface InterviewQuestion { id: string; domain_id: string | null; skill_id: string | null; track: 'technical' | 'hr'; prompt: string; key_points: string[] }

export interface Profile {
  id: string; email: string | null; full_name: string; college: string | null; education: string | null; grad_year: number | null;
  location: string | null; phone: string | null; bio: string | null; github: string | null; linkedin: string | null;
  domain_id: string | null; daily_goal_minutes: number; email_reminders: boolean; created_at: string;
}
export interface SkillClaim { skill_id: string; level: number }
export interface QuizAttempt { id: string; skill_id: string; total: number; correct: number; duration_sec: number; answers: unknown; created_at: string }
export interface CodingAttempt { id: string; challenge_id: string; passed: number; total: number; code: string; created_at: string }
export interface ResumeAnalysis { id: string; file_name: string; raw_text: string; detected_skill_ids: string[]; ats_score: number; breakdown: Record<string, number>; suggestions: string[]; created_at: string }
export interface ProjectProgress { project_id: string; done_requirements: number[]; repo_url: string | null; status: 'in_progress' | 'completed'; updated_at: string }
export interface JobAction { job_id: string; status: 'saved' | 'applied'; note: string | null; updated_at: string }
export interface InterviewAnswer { question_id: string; prompt: string; answer: string; coverage: number; matched: string[]; missed: string[]; clarity: number; score: number }
export interface InterviewSession { id: string; domain_id: string | null; track: string; overall: number; breakdown: Record<string, number>; answers: InterviewAnswer[]; created_at: string }
export interface Goal { id: string; title: string; skill_id: string | null; due_date: string | null; done: boolean; created_at: string; completed_at: string | null }
export interface Activity { id: string; kind: string; label: string; points: number; created_at: string }
