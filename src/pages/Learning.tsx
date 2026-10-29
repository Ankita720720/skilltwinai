import { useMemo, useState } from 'react';
import { ExternalLink, Check, Clock } from 'lucide-react';
import { Card, PageHeader, Badge, Progress, Empty, inputCls } from '../components/ui';
import { useData } from '../store/DataContext';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';
import { supabase } from '../lib/supabase';

export function Learning() {
  const d = useData();
  const { session } = useAuth();
  const toast = useToast();
  const [skill, setSkill] = useState('all');
  const [q, setQ] = useState('');

  // weakest skills first so the page is personalised to the learner's gaps
  const ordered = useMemo(() => Object.values(d.scores).sort((a, b) => a.score - b.score), [d.scores]);
  const list = ordered.filter((s) => skill === 'all' || s.skill.id === skill);

  async function toggle(id: string, title: string, done: boolean) {
    if (!session) return;
    if (done) await supabase.from('resource_progress').delete().eq('user_id', session.user.id).eq('resource_id', id);
    else {
      const { error } = await supabase.from('resource_progress').insert({ user_id: session.user.id, resource_id: id });
      if (error) return toast(error.message, 'err');
      await d.log('learn', `Completed “${title}”`, 3);
    }
    d.refresh();
  }

  const totalDone = d.resources.filter((r) => d.completedResourceIds.has(r.id)).length;
  return (
    <div className="space-y-6">
      <PageHeader title="Learning Resources" sub="Free, high-quality material for each skill — your weakest skills come first. Mark resources complete to raise that skill's score."
        right={<div className="bg-white border border-line rounded-xl px-5 py-3 text-center"><div className="text-[10px] font-bold uppercase text-muted">Completed</div><div className="text-2xl font-extrabold text-brand">{totalDone}/{d.resources.length}</div></div>} />
      <div className="flex flex-wrap gap-3">
        <input className={`${inputCls} max-w-xs`} placeholder="Search resources…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={`${inputCls} max-w-[220px]`} value={skill} onChange={(e) => setSkill(e.target.value)}>
          <option value="all">All skills</option>
          {d.skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      {list.map((s) => {
        const res = d.resources.filter((r) => r.skill_id === s.skill.id && r.title.toLowerCase().includes(q.toLowerCase()));
        if (!res.length) return null;
        const done = res.filter((r) => d.completedResourceIds.has(r.id)).length;
        return (
          <Card key={s.skill.id} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3"><h3 className="font-extrabold text-navy">{s.skill.name}</h3>{s.score < 45 && <Badge tone="red">Priority</Badge>}</div>
              <span className="text-xs text-muted">{done}/{res.length} done · score {s.score}%</span>
            </div>
            <Progress value={(done / res.length) * 100} h="h-1.5" />
            <div className="grid md:grid-cols-2 gap-3 mt-4">
              {res.map((r) => {
                const ok = d.completedResourceIds.has(r.id);
                return (
                  <div key={r.id} className={`border rounded-xl p-4 flex items-start gap-3 ${ok ? 'border-teal/40 bg-teal-soft/40' : 'border-line'}`}>
                    <button onClick={() => toggle(r.id, r.title, ok)} title={ok ? 'Mark as not done' : 'Mark complete'}
                      className={`w-6 h-6 rounded-md border mt-0.5 flex items-center justify-center shrink-0 ${ok ? 'bg-teal border-teal text-white' : 'border-slate-300 hover:border-teal'}`}>{ok && <Check className="w-3.5 h-3.5" />}</button>
                    <div className="flex-1 min-w-0">
                      <a href={r.url} target="_blank" rel="noreferrer" className="font-bold text-navy text-[13px] hover:text-brand flex items-center gap-1.5">{r.title}<ExternalLink className="w-3 h-3" /></a>
                      <div className="text-[11px] text-muted mt-1 flex items-center gap-3"><span>{r.provider}</span><Badge tone="purple">{r.kind}</Badge><span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.minutes >= 60 ? `${Math.round(r.minutes / 6) / 10}h` : `${r.minutes}m`}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
      {d.resources.length === 0 && <Empty title="No resources for this path yet" />}
    </div>
  );
}
