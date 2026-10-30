import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, X, ChevronDown, ChevronUp, Target, BookOpen, FolderGit2, Briefcase, ExternalLink } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { Card, CardHead, Badge, Progress, Empty, LinkBtn, Btn, inputCls, scoreColor } from '../components/ui';
import { HeroCard, heroPrimary, heroGhost } from '../components/HeroCard';
import { useData } from '../store/DataContext';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';
import { supabase } from '../lib/supabase';
import { TARGET, levelLabel } from '../lib/engine';

type Status = 'all' | 'gaps' | 'strong';
type Sort = 'priority' | 'lowest' | 'highest' | 'importance' | 'az';
const TIERS: Record<number, string> = { 1: 'Foundations', 2: 'Core Skills', 3: 'Advanced' };
const PART_LABEL: Record<string, string> = { quiz: 'Quiz average', coding: 'Coding tests', learning: 'Learning completed', project: 'Project progress', claim: 'Self-claim / resume' };

export function SkillGap() {
  const d = useData();
  const { session } = useAuth();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<Status>('all');
  const [tier, setTier] = useState('all');
  const [priority, setPriority] = useState('all');
  const [unverifiedOnly, setUnverifiedOnly] = useState(false);
  const [sort, setSort] = useState<Sort>('priority');
  const [showFilters, setShowFilters] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const gapBySkill = useMemo(() => new Map(d.gaps.map((g) => [g.skill.id, g])), [d.gaps]);
  const everything = Object.values(d.scores);
  const tiers = [...new Set(everything.map((s) => s.skill.tier))].sort();

  const all = useMemo(() => {
    const s = q.trim().toLowerCase();
    const rows = everything.filter((x) => {
      const g = gapBySkill.get(x.skill.id);
      if (s && !x.skill.name.toLowerCase().includes(s)) return false;
      if (status === 'gaps' && !g) return false;
      if (status === 'strong' && x.score < TARGET) return false;
      if (tier !== 'all' && String(x.skill.tier) !== tier) return false;
      if (priority !== 'all' && g?.priority !== priority) return false;
      if (unverifiedOnly && x.verified) return false;
      return true;
    });
    const rank = (x: (typeof rows)[number]) => { const g = gapBySkill.get(x.skill.id); return g ? g.gap * x.skill.weight : -1; };
    rows.sort((a, b) =>
      sort === 'lowest' ? a.score - b.score :
      sort === 'highest' ? b.score - a.score :
      sort === 'importance' ? b.skill.weight - a.skill.weight || a.score - b.score :
      sort === 'az' ? a.skill.name.localeCompare(b.skill.name) :
      rank(b) - rank(a));
    return rows;
  }, [everything, gapBySkill, q, status, tier, priority, unverifiedOnly, sort]);

  const visibleIds = new Set(all.map((x) => x.skill.id));
  const visibleGaps = d.gaps.filter((g) => visibleIds.has(g.skill.id));
  const strong = all.filter((s) => s.score >= TARGET);
  const high = d.gaps.filter((g) => g.priority === 'High').length;
  const unverified = everything.filter((s) => !s.verified).length;
  const pointsToGo = d.gaps.reduce((a, g) => a + g.gap, 0);
  const top = d.gaps[0];

  const radar = all.map((s) => ({ name: s.skill.name.length > 16 ? `${s.skill.name.slice(0, 15)}…` : s.skill.name, You: s.score, Target: TARGET }));

  const activeFilters = (status !== 'all' ? 1 : 0) + (tier !== 'all' ? 1 : 0) + (priority !== 'all' ? 1 : 0) + (unverifiedOnly ? 1 : 0) + (sort !== 'priority' ? 1 : 0);
  const reset = () => { setQ(''); setStatus('all'); setTier('all'); setPriority('all'); setUnverifiedOnly(false); setSort('priority'); };

  const hasGoal = (skillId: string) => d.goals.some((g) => g.skill_id === skillId && !g.done);
  async function setGoal(skillId: string, name: string) {
    if (!session) return;
    const { error } = await supabase.from('goals').insert({ user_id: session.user.id, title: `Reach ${TARGET}% in ${name}`, skill_id: skillId });
    if (error) return toast(error.message, 'err');
    toast('Goal added to your dashboard.');
    d.refresh();
  }

  return (
    <div className="space-y-6">
      <HeroCard eyebrow={`✦ Skill gap • ${d.domain?.name ?? ''}`} ring={d.readiness} ringLabel="Ready"
        title={top ? <>Biggest gap: {top.skill.name} ({top.gap} points to go)</> : 'No gaps — you meet the target on every skill'}
        stats={[{ label: 'At target', value: `${everything.length - d.gaps.length}/${everything.length}` }, { label: 'High priority', value: high }, { label: 'Unverified', value: unverified }, { label: 'Points to go', value: pointsToGo }]}
        actions={<>
          {top && <Link to={`/assessments/quiz/${top.skill.id}`} className={heroPrimary}>Test {top.skill.name}</Link>}
          <Link to="/career-path" className={heroGhost}>See your roadmap</Link>
        </>}>
        Your verified scores compared with the {TARGET}% job-ready target for {d.domain?.role_title}. Gaps are ranked by shortfall × how important the skill is.
      </HeroCard>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input className={`${inputCls} !pl-9`} placeholder="Search a skill…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex bg-white border border-line rounded-lg p-1">
            {([['all', 'All'], ['gaps', 'Gaps'], ['strong', 'Strong']] as const).map(([id, label]) => (
              <button key={id} onClick={() => setStatus(id)} className={`text-xs font-bold px-3.5 py-1.5 rounded-md ${status === id ? 'bg-brand text-white' : 'text-navy'}`}>{label}</button>
            ))}
          </div>
          <Btn variant="ghost" className="!py-2 !text-xs" onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}>
            <SlidersHorizontal className="w-4 h-4" /> Filters{activeFilters > 0 && <span className="ml-1 bg-brand text-white rounded-full text-[10px] px-1.5">{activeFilters}</span>}
          </Btn>
        </div>
        {showFilters && (
          <Card className="p-4 flex flex-wrap gap-4 items-end fade-up">
            <label className="block"><span className="block text-[11px] font-bold text-navy mb-1">Stage</span>
              <select className={`${inputCls} min-w-[150px]`} value={tier} onChange={(e) => setTier(e.target.value)}>
                <option value="all">All stages</option>{tiers.map((t) => <option key={t} value={t}>{TIERS[t] ?? `Stage ${t}`}</option>)}
              </select></label>
            <label className="block"><span className="block text-[11px] font-bold text-navy mb-1">Priority</span>
              <select className={`${inputCls} min-w-[130px]`} value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="all">Any</option><option>High</option><option>Medium</option><option>Low</option>
              </select></label>
            <label className="block"><span className="block text-[11px] font-bold text-navy mb-1">Sort by</span>
              <select className={`${inputCls} min-w-[170px]`} value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                <option value="priority">Biggest priority gap</option><option value="lowest">Lowest score</option><option value="highest">Highest score</option>
                <option value="importance">Most important</option><option value="az">Name (A–Z)</option>
              </select></label>
            <label className="flex items-center gap-2 text-xs font-semibold text-navy pb-2.5"><input type="checkbox" checked={unverifiedOnly} onChange={(e) => setUnverifiedOnly(e.target.checked)} /> Unverified only</label>
            <Btn variant="ghost" className="!py-2 !text-xs" onClick={reset}><X className="w-4 h-4" /> Reset all</Btn>
          </Card>
        )}
        <div className="text-[11px] text-muted">Showing {all.length} of {everything.length} skills</div>
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {radar.length >= 3 && (
            <Card>
              <CardHead title="Skill radar" sub="Your score (purple) against the job-ready target (dashed)" />
              <div className="px-2 pb-4 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radar} outerRadius="72%">
                    <PolarGrid stroke="#E2E8F0" />
                    <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Target" dataKey="Target" stroke="#00A88F" strokeDasharray="4 3" fill="none" />
                    <Radar name="You" dataKey="You" stroke="#5B2EFF" fill="#5B2EFF" fillOpacity={0.25} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          <Card>
            <CardHead title="Current vs target" />
            <div className="px-5 pb-5 space-y-5">
              {all.length === 0 && <Empty title="No skills match" text="Adjust or reset the filters." action={<Btn variant="ghost" onClick={reset}>Reset filters</Btn>} />}
              {all.map((s) => (
                <div key={s.skill.id}>
                  <div className="flex items-center justify-between gap-2 text-[13px] mb-1.5">
                    <span className="font-semibold text-navy">{s.skill.name} <span className="text-[11px] text-muted font-normal">· importance {s.skill.weight}/5 · {TIERS[s.skill.tier] ?? `Stage ${s.skill.tier}`}</span>{!s.verified && <span className="ml-1.5 align-middle"><Badge tone="amber">Unverified</Badge></span>}</span>
                    <span className="text-muted text-xs whitespace-nowrap"><b className="text-navy">{s.score}%</b> / {TARGET}% · {levelLabel(s.score)}</span>
                  </div>
                  <div className="relative">
                    <Progress value={s.score} color={scoreColor(s.score)} h="h-2.5" />
                    <div className="absolute top-[-3px] h-4 w-0.5 bg-navy/60" style={{ left: `${TARGET}%` }} title="Target" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHead title="Priority gaps" sub="Tap a gap for its action plan" />
            <div className="px-5 pb-5 space-y-3">
              {d.gaps.length === 0 && <Empty title="No gaps!" text="You meet the target on every skill." />}
              {d.gaps.length > 0 && visibleGaps.length === 0 && <p className="text-xs text-muted">No gaps match the current filters.</p>}
              {visibleGaps.map((g) => {
                const sc = d.scores[g.skill.id];
                const open = openId === g.skill.id;
                const qCount = d.questionCounts[g.skill.id] || 0;
                const nextRes = d.resources.find((r) => r.skill_id === g.skill.id && !d.completedResourceIds.has(r.id));
                const proj = d.projects.find((p) => p.skill_slugs.includes(g.skill.slug));
                const jobsNeeding = d.jobMatches.filter((m) => m.job.required_skills.includes(g.skill.slug)).length;
                const parts = Object.entries(sc?.parts ?? {}) as [string, number][];
                return (
                  <div key={g.skill.id} className="border border-line rounded-xl overflow-hidden">
                    <button onClick={() => setOpenId(open ? null : g.skill.id)} className="w-full text-left p-3.5 hover:bg-slate-50" aria-expanded={open}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-navy text-[13px]">{g.skill.name}</span>
                        <span className="flex items-center gap-2"><Badge tone={g.priority === 'High' ? 'red' : g.priority === 'Medium' ? 'amber' : 'slate'}>{g.priority}</Badge>{open ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}</span>
                      </div>
                      <div className="text-[11px] text-muted mt-1">{g.score}% now · {g.gap} points to go{!g.verified && ' · not yet verified'}</div>
                      <div className="mt-2"><Progress value={g.score} h="h-1.5" /></div>
                    </button>
                    {open && (
                      <div className="border-t border-line bg-slate-50/60 p-3.5 space-y-3 fade-up">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">Where your score comes from</div>
                          {parts.length === 0 ? <p className="text-[11px] text-muted">No evidence yet — take a quiz to start.</p> : (
                            <div className="space-y-1">{parts.map(([k, v]) => <div key={k} className="flex justify-between text-[11px]"><span className="text-muted">{PART_LABEL[k] ?? k}</span><b className="text-navy">{Math.round(v)}%</b></div>)}</div>
                          )}
                        </div>
                        <div className="space-y-1.5 text-[12px]">
                          {qCount > 0 && <Link className="flex items-center gap-2 font-semibold text-brand" to={`/assessments/quiz/${g.skill.id}`}><Target className="w-3.5 h-3.5" /> Take the {g.skill.name} quiz ({qCount} questions)</Link>}
                          {nextRes && <a className="flex items-center gap-2 font-semibold text-brand" href={nextRes.url} target="_blank" rel="noreferrer noopener"><BookOpen className="w-3.5 h-3.5" /> Study: {nextRes.title} <ExternalLink className="w-3 h-3" /></a>}
                          {proj && <Link className="flex items-center gap-2 font-semibold text-brand" to={`/projects/${proj.id}`}><FolderGit2 className="w-3.5 h-3.5" /> Build: {proj.title}</Link>}
                          {jobsNeeding > 0 && <Link className="flex items-center gap-2 text-muted" to="/jobs"><Briefcase className="w-3.5 h-3.5" /> Needed by {jobsNeeding} of your job matches</Link>}
                        </div>
                        <div className="flex items-center gap-3 pt-1">
                          {hasGoal(g.skill.id) ? <Badge tone="green">✓ Goal set</Badge> : <Btn className="!py-1.5 !px-3 !text-[11px]" onClick={() => setGoal(g.skill.id, g.skill.name)}>Set as goal</Btn>}
                          <Link className="text-[11px] font-bold text-brand" to="/learning">All resources →</Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
          <Card>
            <CardHead title="Strengths" />
            <div className="px-5 pb-5 flex flex-wrap gap-2">
              {strong.length === 0 ? <p className="text-xs text-muted">Skills at {TARGET}%+ will appear here.</p> : strong.map((s) => <Badge key={s.skill.id} tone="teal">{s.skill.name} · {s.score}%</Badge>)}
            </div>
          </Card>
          <LinkBtn to="/career-path" variant="ghost" className="w-full">See your roadmap →</LinkBtn>
        </div>
      </div>
    </div>
  );
}
