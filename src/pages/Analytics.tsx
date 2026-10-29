import { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { Card, CardHead, PageHeader, StatCard, Empty, scoreColor } from '../components/ui';
import { useData } from '../store/DataContext';
import { dayKey, TARGET } from '../lib/engine';
import { TrendingUp, Zap, Flame, Award } from 'lucide-react';

export function Analytics() {
  const d = useData();

  const trend = useMemo(() => [...d.quizzes].reverse().map((q, i) => ({
    n: i + 1, label: new Date(q.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: Math.round((q.correct / q.total) * 100), skill: d.skills.find((s) => s.id === q.skill_id)?.name ?? '',
  })), [d.quizzes, d.skills]);

  const daily = useMemo(() => {
    const out: { day: string; actions: number; points: number }[] = [];
    for (let k = 13; k >= 0; k--) {
      const dt = new Date(); dt.setDate(dt.getDate() - k);
      const key = dayKey(dt);
      const rows = d.activity.filter((a) => dayKey(a.created_at) === key);
      out.push({ day: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), actions: rows.length, points: rows.reduce((s, r) => s + r.points, 0) });
    }
    return out;
  }, [d.activity]);

  const bySkill = Object.values(d.scores).map((s) => ({ name: s.skill.name, score: s.score }));
  const kinds = useMemo(() => {
    const m: Record<string, number> = {};
    d.activity.forEach((a) => { m[a.kind] = (m[a.kind] || 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [d.activity]);
  const palette = ['#5B2EFF', '#00A88F', '#F59E0B', '#0B1F3A', '#EF4444', '#8B5CF6', '#14B8A6'];
  const totalPoints = d.activity.reduce((s, a) => s + a.points, 0);
  const avgQuiz = d.quizzes.length ? Math.round(d.quizzes.reduce((s, q) => s + (q.correct / q.total) * 100, 0) / d.quizzes.length) : 0;
  const strong = Object.values(d.scores).filter((s) => s.score >= TARGET).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics & Reports" sub="Charts below are drawn from your own attempts and activity log." />
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Avg quiz score" value={`${avgQuiz}%`} sub={`${d.quizzes.length} attempts`} icon={<TrendingUp className="w-5 h-5" />} />
        <StatCard label="Activity points" value={totalPoints} sub={`${d.activity.length} logged actions`} icon={<Zap className="w-5 h-5" />} tone="teal" />
        <StatCard label="Current streak" value={`${d.streak.current}d`} sub={`best ${d.streak.best}d`} icon={<Flame className="w-5 h-5" />} tone="amber" />
        <StatCard label="Skills at target" value={`${strong}/${Object.keys(d.scores).length}`} sub={`${TARGET}%+ score`} icon={<Award className="w-5 h-5" />} tone="navy" />
      </div>
      <div className="grid xl:grid-cols-2 gap-6">
        <Card>
          <CardHead title="Quiz score trend" sub="Every quiz attempt, oldest to newest" />
          <div className="h-64 px-3 pb-4">
            {trend.length === 0 ? <Empty title="No quiz data yet" /> : (
              <ResponsiveContainer><LineChart data={trend}><CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" /><XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 11 }} /><Tooltip formatter={(v) => `${v}%`} labelFormatter={(_, p) => p?.[0]?.payload?.skill} /><Line type="monotone" dataKey="score" stroke="#5B2EFF" strokeWidth={3} dot={{ r: 4 }} /></LineChart></ResponsiveContainer>
            )}
          </div>
        </Card>
        <Card>
          <CardHead title="Activity — last 14 days" />
          <div className="h-64 px-3 pb-4">
            <ResponsiveContainer><BarChart data={daily}><CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" /><XAxis dataKey="day" tick={{ fontSize: 10 }} interval={1} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="actions" fill="#00A88F" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHead title="Skill scores" sub={`Dashed target = ${TARGET}%`} />
          <div className="h-72 px-3 pb-4">
            <ResponsiveContainer><BarChart data={bySkill} layout="vertical" margin={{ left: 20 }}><CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" /><XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} /><YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} /><Tooltip formatter={(v) => `${v}%`} /><Bar dataKey="score" radius={[0, 4, 4, 0]}>{bySkill.map((b, i) => <Cell key={i} fill={scoreColor(b.score)} />)}</Bar></BarChart></ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHead title="Where your time goes" sub="Share of logged actions by type" />
          <div className="h-72 px-3 pb-4">
            {kinds.length === 0 ? <Empty title="No activity yet" /> : (
              <ResponsiveContainer><PieChart><Pie data={kinds} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2} label={(e) => e.name}>{kinds.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
      <Card>
        <CardHead title="Interview performance" />
        <div className="px-5 pb-5">
          {d.sessions.length === 0 ? <Empty title="No interviews yet" /> : (
            <div className="h-56"><ResponsiveContainer><BarChart data={[...d.sessions].reverse().map((s, i) => ({ n: `#${i + 1}`, overall: s.overall }))}><CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" /><XAxis dataKey="n" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 11 }} /><Tooltip formatter={(v) => `${v}%`} /><Bar dataKey="overall" fill="#5B2EFF" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
          )}
        </div>
      </Card>
    </div>
  );
}
