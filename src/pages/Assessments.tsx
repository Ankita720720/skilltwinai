import { Link } from 'react-router-dom';
import { Clock, Code2, ShieldCheck } from 'lucide-react';
import { Card, CardHead, PageHeader, Badge, Progress, LinkBtn, Empty, scoreColor, timeAgo } from '../components/ui';
import { useData } from '../store/DataContext';

export function Assessments() {
  const d = useData();
  const skillName = (id: string) => d.skills.find((s) => s.id === id)?.name ?? 'Skill';
  const history = [
    ...d.quizzes.map((q) => ({ id: q.id, kind: 'Quiz', name: skillName(q.skill_id), pct: Math.round((q.correct / q.total) * 100), detail: `${q.correct}/${q.total}`, at: q.created_at })),
    ...d.coding.map((c) => ({ id: c.id, kind: 'Coding', name: d.challenges.find((x) => x.id === c.challenge_id)?.title ?? 'Challenge', pct: Math.round((c.passed / c.total) * 100), detail: `${c.passed}/${c.total} tests`, at: c.created_at })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <div className="space-y-6">
      <PageHeader title="Assessments" sub="Every attempt updates your skill score, gap analysis and job matches. Your latest three attempts per skill are averaged, so you can improve." />
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {Object.values(d.scores).map((s) => {
          const count = d.questionCounts[s.skill.id] || 0;
          return (
            <Card key={s.skill.id} className="p-5 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-navy">{s.skill.name}</h3>
                {s.verified ? <Badge tone="teal"><ShieldCheck className="w-3 h-3 mr-1" />Verified</Badge> : <Badge>Not tested</Badge>}
              </div>
              <p className="text-xs text-muted mt-1 flex-1">{s.skill.description}</p>
              <div className="mt-4 flex justify-between text-xs text-muted"><span>Current score</span><b className="text-navy">{s.score}%</b></div>
              <div className="mt-1.5"><Progress value={s.score} color={scoreColor(s.score)} /></div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[11px] text-muted flex items-center gap-1"><Clock className="w-3 h-3" /> {count} questions · {s.quizAttempts} attempt{s.quizAttempts === 1 ? '' : 's'}</span>
                {count > 0 ? <LinkBtn to={`/assessments/quiz/${s.skill.id}`} className="!py-2 !px-3 !text-xs">{s.quizAttempts ? 'Retake' : 'Start quiz'}</LinkBtn> : <Badge>No questions</Badge>}
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHead title="Coding challenges" sub="Runs your code against hidden-style test cases in a sandboxed worker" />
        <div className="px-5 pb-5 grid md:grid-cols-2 gap-4">
          {d.challenges.length === 0 && <Empty title="No coding challenges for this path yet" />}
          {d.challenges.map((c) => {
            const best = Math.max(0, ...d.coding.filter((a) => a.challenge_id === c.id).map((a) => Math.round((a.passed / a.total) * 100)));
            const tried = d.coding.some((a) => a.challenge_id === c.id);
            return (
              <Link key={c.id} to={`/assessments/coding/${c.id}`} className="border border-line rounded-xl p-4 hover:border-brand transition flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center"><Code2 className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0"><div className="font-bold text-navy text-sm">{c.title}</div><div className="text-[11px] text-muted capitalize">{c.difficulty} · {skillName(c.skill_id ?? '')}</div></div>
                {tried ? <Badge tone={best === 100 ? 'green' : 'amber'}>Best {best}%</Badge> : <Badge>New</Badge>}
              </Link>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardHead title="Attempt history" />
        <div className="px-5 pb-5 overflow-x-auto">
          {history.length === 0 ? <Empty title="No attempts yet" text="Take a quiz above to see results here." /> : (
            <table className="w-full text-[13px]">
              <thead><tr className="text-left text-[11px] uppercase text-muted tracking-wider"><th className="py-2">Type</th><th>Name</th><th>Result</th><th>Score</th><th className="text-right">When</th></tr></thead>
              <tbody>{history.slice(0, 15).map((h) => (
                <tr key={h.id} className="border-t border-line"><td className="py-2.5"><Badge tone={h.kind === 'Quiz' ? 'purple' : 'teal'}>{h.kind}</Badge></td><td className="font-semibold text-navy">{h.name}</td><td className="text-muted">{h.detail}</td><td><b className="text-navy">{h.pct}%</b></td><td className="text-right text-muted text-xs">{timeAgo(h.at)}</td></tr>
              ))}</tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
