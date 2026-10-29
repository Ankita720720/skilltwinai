import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, ClipboardCheck, Flame, ShieldCheck, ArrowRight, Plus, Check, Trash2, Sparkles } from 'lucide-react';
import { Card, CardHead, StatCard, Progress, Badge, Ring, Empty, Btn, inputCls, timeAgo, scoreColor } from '../components/ui';
import { useData } from '../store/DataContext';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';
import { supabase } from '../lib/supabase';
import { levelLabel } from '../lib/engine';

export function Dashboard() {
  const d = useData();
  const { profile, session } = useAuth();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const first = (profile?.full_name || 'there').split(' ')[0];
  const verified = Object.values(d.scores).filter((s) => s.verified).length;
  const sorted = Object.values(d.scores).sort((a, b) => b.score - a.score);
  const top = d.jobMatches.slice(0, 3);

  async function addGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !session) return;
    const { error } = await supabase.from('goals').insert({ user_id: session.user.id, title: title.trim() });
    if (error) return toast(error.message, 'err');
    setTitle(''); d.refresh();
  }
  async function toggle(id: string, done: boolean) {
    await supabase.from('goals').update({ done: !done, completed_at: !done ? new Date().toISOString() : null }).eq('id', id);
    if (!done) await d.log('goal', 'Completed a goal', 5);
    d.refresh();
  }
  async function remove(id: string) { await supabase.from('goals').delete().eq('id', id); d.refresh(); }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-[27px] font-extrabold text-navy tracking-tight">Welcome back, {first} 👋</h1>
        <p className="text-[13px] text-muted mt-1">Your progress toward <strong className="text-navy">{d.domain?.role_title}</strong>, calculated from your activity.</p>
      </div>

      <div className="bg-gradient-to-r from-navy via-[#12284C] to-[#162F52] text-white rounded-[17px] p-6 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
        <div className="max-w-2xl">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#B8AAFF] mb-2">✦ Job readiness • {d.domain?.name}</div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2">
            {verified === 0 ? 'Take your first assessment to get a real score' : `You are ${d.readiness}% ready for ${d.domain?.role_title}`}
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            {d.gaps.length
              ? <>Biggest opportunities: <strong className="text-white">{d.gaps.slice(0, 3).map((g) => g.skill.name).join(', ')}</strong>.</>
              : 'Every skill meets the target — time to apply.'}{' '}
            {verified}/{Object.keys(d.scores).length} skills verified by tests.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Link to="/assessments" className="bg-brand hover:bg-brand-dark text-xs font-bold px-4 py-2.5 rounded-[9px]">Take an assessment</Link>
            <Link to="/skill-gap" className="bg-white/10 hover:bg-white/20 text-xs font-bold px-4 py-2.5 rounded-[9px]">View skill gap</Link>
          </div>
        </div>
        <Ring value={d.readiness} size={132} label="Ready" />
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Readiness" value={`${d.readiness}%`} sub="weighted by skill importance" icon={<Target className="w-5 h-5" />} />
        <StatCard label="Verified skills" value={`${verified}/${Object.keys(d.scores).length}`} sub="backed by a quiz or coding test" icon={<ShieldCheck className="w-5 h-5" />} tone="teal" />
        <StatCard label="Assessments" value={d.quizzes.length + d.coding.length} sub="quizzes + coding attempts" icon={<ClipboardCheck className="w-5 h-5" />} tone="navy" />
        <StatCard label="Day streak" value={d.streak.current} sub={`best: ${d.streak.best} days`} icon={<Flame className="w-5 h-5" />} tone="amber" />
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHead title="Your skill profile" sub="Scores update whenever you test, learn or build" right={<Link to="/assessments" className="text-xs font-bold text-brand">Improve →</Link>} />
          <div className="px-5 pb-5 space-y-3.5">
            {sorted.map((s) => (
              <div key={s.skill.id}>
                <div className="flex items-center justify-between mb-1.5 text-[13px]">
                  <span className="font-semibold text-navy flex items-center gap-2">{s.skill.name} {s.verified ? <Badge tone="teal">Verified</Badge> : <Badge>Unverified</Badge>}</span>
                  <span className="text-muted text-xs"><b className="text-navy">{s.score}%</b> · {levelLabel(s.score)}</span>
                </div>
                <Progress value={s.score} color={scoreColor(s.score)} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHead title="Next best actions" sub="Chosen from your current gaps" right={<Sparkles className="w-4 h-4 text-brand" />} />
          <div className="px-5 pb-5 space-y-3">
            {d.actions.length === 0 && <Empty title="You're all caught up" />}
            {d.actions.map((a) => (
              <Link key={a.id} to={a.to} className="block rounded-xl border border-line p-3.5 hover:border-brand hover:bg-brand-soft/40 transition">
                <div className="text-[13px] font-bold text-navy">{a.title}</div>
                <div className="text-[11px] text-muted mt-0.5">{a.why}</div>
                <div className="text-[11px] font-bold text-brand mt-2 flex items-center gap-1">{a.cta} <ArrowRight className="w-3 h-3" /></div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <Card>
          <CardHead title="Top skill gaps" right={<Link to="/skill-gap" className="text-xs font-bold text-brand">All →</Link>} />
          <div className="px-5 pb-5 space-y-2.5">
            {d.gaps.length === 0 && <Empty title="No gaps" text="All skills meet the target." />}
            {d.gaps.slice(0, 5).map((g) => (
              <div key={g.skill.id} className="flex items-center justify-between text-[13px]">
                <span className="font-semibold text-navy">{g.skill.name}</span>
                <Badge tone={g.priority === 'High' ? 'red' : g.priority === 'Medium' ? 'amber' : 'slate'}>{g.priority} · −{g.gap}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHead title="Daily goals" sub="Your own to-do list" />
          <div className="px-5 pb-5">
            <form onSubmit={addGoal} className="flex gap-2 mb-3">
              <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Finish React hooks chapter" />
              <Btn type="submit" className="!px-3"><Plus className="w-4 h-4" /></Btn>
            </form>
            {d.goals.length === 0 && <p className="text-xs text-muted text-center py-4">No goals yet — add one above.</p>}
            <div className="space-y-2 max-h-56 overflow-y-auto scroll-thin">
              {d.goals.slice(0, 8).map((g) => (
                <div key={g.id} className="flex items-center gap-2.5 text-[13px] group">
                  <button onClick={() => toggle(g.id, g.done)} className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${g.done ? 'bg-teal border-teal text-white' : 'border-slate-300'}`}>{g.done && <Check className="w-3 h-3" />}</button>
                  <span className={`flex-1 ${g.done ? 'line-through text-muted' : 'text-navy font-medium'}`}>{g.title}</span>
                  <button onClick={() => remove(g.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardHead title="Recent activity" />
          <div className="px-5 pb-5 space-y-3">
            {d.activity.length === 0 && <Empty title="Nothing yet" text="Your actions will show up here." />}
            {d.activity.slice(0, 6).map((a) => (
              <div key={a.id} className="flex items-start gap-3 text-[13px]">
                <div className="w-2 h-2 rounded-full bg-teal mt-1.5" />
                <div className="flex-1 text-navy font-medium">{a.label}</div>
                <span className="text-[11px] text-muted whitespace-nowrap">{timeAgo(a.created_at)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHead title="Best job matches for you" right={<Link to="/jobs" className="text-xs font-bold text-brand">All matches →</Link>} />
        <div className="px-5 pb-5 grid md:grid-cols-3 gap-4">
          {top.length === 0 && <Empty title="No jobs for this domain yet" />}
          {top.map((m) => (
            <div key={m.job.id} className="border border-line rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div><div className="font-bold text-navy text-sm">{m.job.title}</div><div className="text-xs text-muted">{m.job.company}</div></div>
                <Badge tone={m.match >= 65 ? 'green' : 'amber'}>{m.match}%</Badge>
              </div>
              <Progress value={m.match} h="h-1.5" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
