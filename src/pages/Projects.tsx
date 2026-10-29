import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Clock } from 'lucide-react';
import { Card, CardHead, PageHeader, Badge, Progress, Btn, Empty, inputCls } from '../components/ui';
import { useData } from '../store/DataContext';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';
import { supabase } from '../lib/supabase';

export function Projects() {
  const d = useData();
  const [diff, setDiff] = useState('All');
  const gapSlugs = new Set(d.gaps.slice(0, 3).map((g) => g.skill.slug));
  const list = d.projects
    .filter((p) => diff === 'All' || p.difficulty === diff)
    .map((p) => ({ p, rec: p.skill_slugs.some((s) => gapSlugs.has(s)), prog: d.projectProgress.find((x) => x.project_id === p.id) }))
    .sort((a, b) => Number(b.rec) - Number(a.rec));
  const done = d.projectProgress.filter((x) => x.status === 'completed').length;
  return (
    <div>
      <PageHeader title="Projects" sub="Portfolio projects ranked by how well they target your biggest gaps. Finishing requirements raises the related skill scores."
        right={<div className="bg-white border border-line rounded-xl px-5 py-3 text-center"><div className="text-[10px] font-bold uppercase text-muted">Completed</div><div className="text-2xl font-extrabold text-brand">{done}/{d.projects.length}</div></div>} />
      <div className="flex gap-2 mb-5">{['All', 'Beginner', 'Intermediate', 'Advanced'].map((x) => <button key={x} onClick={() => setDiff(x)} className={`text-xs font-bold px-3.5 py-2 rounded-lg border ${diff === x ? 'bg-brand text-white border-brand' : 'bg-white border-line text-navy'}`}>{x}</button>)}</div>
      {list.length === 0 && <Empty title="No projects match" />}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {list.map(({ p, rec, prog }) => {
          const pct = prog ? Math.round((prog.done_requirements.length / p.requirements.length) * 100) : 0;
          return (
            <Link key={p.id} to={`/projects/${p.id}`}>
              <Card className="p-5 h-full hover:shadow-md hover:border-brand transition flex flex-col">
                <div className="flex gap-2 mb-2"><Badge tone={p.difficulty === 'Beginner' ? 'green' : p.difficulty === 'Intermediate' ? 'amber' : 'red'}>{p.difficulty}</Badge>{rec && <Badge tone="purple">Targets your gaps</Badge>}{prog?.status === 'completed' && <Badge tone="teal">Done</Badge>}</div>
                <h3 className="font-extrabold text-navy">{p.title}</h3>
                <p className="text-xs text-muted mt-1 flex-1">{p.summary}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">{p.skill_slugs.map((s) => <span key={s} className="text-[10px] bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">{d.skills.find((k) => k.slug === s)?.name ?? s}</span>)}</div>
                <div className="mt-4"><Progress value={pct} h="h-1.5" /><div className="flex justify-between text-[11px] text-muted mt-1"><span>{pct}% complete</span><span className="flex items-center gap-1"><Clock className="w-3 h-3" />~{p.est_hours}h</span></div></div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function ProjectDetail() {
  const { id } = useParams();
  const d = useData();
  const { session } = useAuth();
  const toast = useToast();
  const p = d.projects.find((x) => x.id === id);
  const prog = d.projectProgress.find((x) => x.project_id === id);
  const [done, setDone] = useState<number[]>([]);
  const [repo, setRepo] = useState('');
  useEffect(() => { setDone(prog?.done_requirements ?? []); setRepo(prog?.repo_url ?? ''); }, [prog?.project_id, prog?.updated_at]);
  if (!p) return <p className="text-sm text-muted">Project not found. <Link to="/projects" className="text-brand font-bold">Back</Link></p>;

  const pct = Math.round((done.length / p.requirements.length) * 100);
  async function save(next: number[], repoUrl: string) {
    if (!session) return;
    const complete = next.length === p!.requirements.length && /^https?:\/\//.test(repoUrl);
    const { error } = await supabase.from('project_progress').upsert({
      user_id: session.user.id, project_id: p!.id, done_requirements: next, repo_url: repoUrl,
      status: complete ? 'completed' : 'in_progress', updated_at: new Date().toISOString(),
    });
    if (error) return toast(error.message, 'err');
    if (complete && prog?.status !== 'completed') { await d.log('project', `Completed project “${p!.title}”`, 20); toast('Project completed! 🎉'); }
    d.refresh();
  }
  const toggle = (i: number) => { const next = done.includes(i) ? done.filter((x) => x !== i) : [...done, i]; setDone(next); save(next, repo); };

  return (
    <div className="max-w-4xl space-y-6">
      <Link to="/projects" className="text-xs font-bold text-brand flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" /> All projects</Link>
      <PageHeader title={p.title} sub={p.summary} right={<Badge tone="purple">{p.difficulty} · ~{p.est_hours}h</Badge>} />
      <Card>
        <CardHead title="Requirements" sub={`${done.length}/${p.requirements.length} done`} right={<span className="text-sm font-extrabold text-brand">{pct}%</span>} />
        <div className="px-5 pb-5 space-y-2.5">
          <Progress value={pct} />
          {p.requirements.map((r, i) => (
            <button key={i} onClick={() => toggle(i)} className={`w-full flex items-center gap-3 text-left rounded-xl border px-4 py-3 text-[13px] ${done.includes(i) ? 'border-teal/40 bg-teal-soft/40' : 'border-line hover:border-brand/40'}`}>
              <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${done.includes(i) ? 'bg-teal border-teal text-white' : 'border-slate-300'}`}>{done.includes(i) && <Check className="w-3 h-3" />}</span>
              <span className={done.includes(i) ? 'text-muted line-through' : 'text-navy font-medium'}>{r}</span>
            </button>
          ))}
        </div>
      </Card>
      <Card>
        <CardHead title="Submit your work" sub="Add your repository or live URL. A project is marked completed when every requirement is ticked and a link is saved." />
        <div className="px-5 pb-5 flex gap-3">
          <input className={inputCls} placeholder="https://github.com/you/project" value={repo} onChange={(e) => setRepo(e.target.value)} />
          <Btn onClick={() => save(done, repo)}>Save</Btn>
        </div>
        {prog?.status === 'completed' && <div className="px-5 pb-5"><Badge tone="teal">✓ Completed</Badge></div>}
      </Card>
    </div>
  );
}
