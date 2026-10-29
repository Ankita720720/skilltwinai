# SkillTwin Live

A dynamic rebuild of the SkillTwin AI idea (same look and pages) with **new code, new business logic and a new database**.
Nothing a student sees is hard-coded: every score, gap, roadmap stage, job match and chart is computed from that user's own activity.

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS v4 · Supabase (Auth + Postgres + RLS) · Recharts

## Setup (5 minutes)
1. Create a **new** Supabase project.
2. SQL editor → run `supabase/schema.sql`, then `supabase/seed.sql`.
3. (Dev convenience) Authentication → Providers → Email → turn off "Confirm email".
4. `cp .env.example .env` and fill `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
5. `npm install && npm run dev`

## How it's dynamic
| Area | Business logic (`src/lib/engine.ts`) |
|---|---|
| Skill score | Weighted blend of: last-3 quiz average (50), coding pass-rate (20), learning completion (15), project progress (15), claim/resume detection (15). Without a quiz/coding result a skill is **unverified** and capped at 60. |
| Readiness | Σ weight × min(score / 70, 1) ÷ Σ weight |
| Skill gap | `70 − score`, ranked by gap × skill importance; High/Medium/Low by size |
| Roadmap | Skills grouped by tier; stage progress = mean of min(score/70, 1) |
| Job match | Mean of min(score/70, 1) over the job's required skills |
| Resume | Keyword detection against the domain's skills + ATS-style score (skills, structure, impact, contact, length) |
| Interview | Key-concept coverage (65%) + clarity (35%); questions prioritise your weakest skills |
| Coding tests | User code runs in a Web Worker with a 2.5 s timeout |
| Next actions | Rule-based coach picks the next best steps from your data |

## Database
- **Catalog (shared, read-only):** `domains, skills, questions, coding_challenges, resources, projects, jobs, interview_questions`
- **Per-user (RLS: own rows only):** `profiles, skill_claims, quiz_attempts, coding_attempts, resume_analyses, resource_progress, project_progress, job_actions, interview_sessions, goals, activity_log`
- A trigger creates a `profiles` row on sign-up.

Add content by inserting rows (new skills, questions, jobs, domains) — the UI picks them up with no code change.

## Notes
- Job rows in the seed are **sample** listings with fictional companies. Replace them with a real feed.
- Quiz answer keys are readable by signed-in users (learning app, not a proctored exam).
- `scripts/gen_seed.py` regenerates `supabase/seed.sql`.


## Progressive Web App (PWA)

SkillTwin Live includes a web app manifest, app icons, an install button, and a service worker with a cache-safe update strategy.

- The service worker deliberately does **not** cache HTML, static assets, API responses, or authenticated data. This avoids serving stale app code after a deployment.
- A new service-worker version waits for the user to select **Update**; the app then activates it and reloads.
- Install is available on supported browsers. On browsers without the native install prompt (including iOS Safari), the button shows platform-specific instructions.
- This strategy prioritizes fresh deployments over offline support: the app requires a network connection.

For production, serve the site over HTTPS (localhost is allowed for development). After deploying, hard-refresh once if an older service worker from a previous build is already installed.
