import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { Card, PageHeader, Progress, Badge, scoreColor } from '../components/ui';
import { useData } from '../store/DataContext';
import { TARGET } from '../lib/engine';

export function CareerPath() {
  const d = useData();
  return (
    <div>
      <PageHeader title="Career Path" sub={`A roadmap to ${d.domain?.role_title}. Stage progress is computed from your skill scores — it moves as you improve.`}
        right={<div className="bg-white border border-line rounded-xl px-5 py-3 text-center"><div className="text-[10px] font-bold uppercase text-muted">Overall</div><div className="text-2xl font-extrabold text-brand">{d.readiness}%</div></div>} />
      <div className="relative space-y-6 max-w-4xl">
        <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-line" />
        {d.roadmap.map((step, idx) => {
          const Icon = step.status === 'Completed' ? CheckCircle2 : step.status === 'In Progress' ? Loader2 : Circle;
          const color = step.status === 'Completed' ? 'text-teal' : step.status === 'In Progress' ? 'text-brand' : 'text-slate-300';
          return (
            <div key={step.tier} className="relative flex gap-5">
              <div className="relative z-10 w-10 h-10 rounded-full bg-white border-2 border-line flex items-center justify-center shrink-0"><Icon className={`w-5 h-5 ${color}`} /></div>
              <Card className="flex-1 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div><div className="text-[11px] font-bold text-brand uppercase tracking-wider">Stage {idx + 1}</div><h3 className="font-extrabold text-navy text-lg">{step.title}</h3></div>
                  <Badge tone={step.status === 'Completed' ? 'green' : step.status === 'In Progress' ? 'purple' : 'slate'}>{step.status}</Badge>
                </div>
                <p className="text-xs text-muted mt-1 mb-3">{step.blurb}</p>
                <Progress value={step.progress} color={scoreColor(step.progress)} />
                <div className="text-[11px] text-muted mt-1 mb-4">{step.progress}% of target reached</div>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {step.skills.map((s) => (
                    <div key={s.skill.id} className="flex items-center justify-between border border-line rounded-lg px-3 py-2 text-[13px]">
                      <span className="font-semibold text-navy">{s.skill.name}</span>
                      {s.score >= TARGET ? <Badge tone="green">{s.score}%</Badge> : <Link to={`/assessments/quiz/${s.skill.id}`} className="text-[11px] font-bold text-brand">{s.score}% · Improve →</Link>}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
