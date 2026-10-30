import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { Card, Progress, Badge, scoreColor } from '../components/ui';
import { HeroCard, heroPrimary, heroGhost } from '../components/HeroCard';
import { useData } from '../store/DataContext';
import { TARGET } from '../lib/engine';

export function CareerPath() {
  const d = useData();
  const current = d.roadmap.find((s) => s.status !== 'Completed');
  const currentIdx = current ? d.roadmap.indexOf(current) : -1;
  const focus = current?.skills.filter((s) => s.score < TARGET).sort((a, b) => a.score - b.score)[0];
  const doneStages = d.roadmap.filter((s) => s.status === 'Completed').length;
  const atTarget = Object.values(d.scores).filter((s) => s.score >= TARGET).length;
  return (
    <div>
      <HeroCard eyebrow={`✦ Career path • ${d.domain?.name ?? ''}`} ring={d.readiness} ringLabel="Ready"
        title={current ? `You're on Stage ${currentIdx + 1}: ${current.title} (${current.progress}%)` : `Roadmap complete — you're ready for ${d.domain?.role_title}`}
        stats={[{ label: 'Stages done', value: `${doneStages}/${d.roadmap.length}` }, { label: 'Skills at target', value: `${atTarget}/${Object.keys(d.scores).length}` }, { label: 'Gaps left', value: d.gaps.length }]}
        actions={<>
          {focus && <Link to={`/assessments/quiz/${focus.skill.id}`} className={heroPrimary}>Improve {focus.skill.name}</Link>}
          <Link to="/skill-gap" className={heroGhost}>View skill gap</Link>
        </>}>
        Your roadmap to <strong className="text-white">{d.domain?.role_title}</strong>. Stage progress is computed from your skill scores — it moves as you improve.
      </HeroCard>
      <div className="h-6" />
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
