import { Link } from 'react-router-dom';
import { Card, CardHead, PageHeader, Badge, Progress, Empty, LinkBtn, scoreColor } from '../components/ui';
import { useData } from '../store/DataContext';
import { TARGET, levelLabel } from '../lib/engine';

export function SkillGap() {
  const d = useData();
  const all = Object.values(d.scores).sort((a, b) => a.score - b.score);
  const strong = all.filter((s) => s.score >= TARGET);
  return (
    <div className="space-y-6">
      <PageHeader title="Skill Gap Analysis" sub={`Your verified scores compared with the ${TARGET}% job-ready target for ${d.domain?.role_title}. Gaps are ranked by shortfall × how important the skill is.`}
        right={<div className="bg-white border border-line rounded-xl px-5 py-3 text-center"><div className="text-[10px] font-bold uppercase text-muted">Readiness</div><div className="text-2xl font-extrabold text-brand">{d.readiness}%</div></div>} />

      <div className="grid xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHead title="Current vs target" />
          <div className="px-5 pb-5 space-y-5">
            {all.map((s) => (
              <div key={s.skill.id}>
                <div className="flex items-center justify-between text-[13px] mb-1.5">
                  <span className="font-semibold text-navy">{s.skill.name} <span className="text-[11px] text-muted font-normal">· importance {s.skill.weight}/5</span></span>
                  <span className="text-muted text-xs"><b className="text-navy">{s.score}%</b> / {TARGET}% · {levelLabel(s.score)}</span>
                </div>
                <div className="relative">
                  <Progress value={s.score} color={scoreColor(s.score)} h="h-2.5" />
                  <div className="absolute top-[-3px] h-4 w-0.5 bg-navy/60" style={{ left: `${TARGET}%` }} title="Target" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHead title="Priority gaps" />
            <div className="px-5 pb-5 space-y-3">
              {d.gaps.length === 0 && <Empty title="No gaps!" text="You meet the target on every skill." />}
              {d.gaps.map((g) => (
                <div key={g.skill.id} className="border border-line rounded-xl p-3.5">
                  <div className="flex items-center justify-between"><span className="font-bold text-navy text-[13px]">{g.skill.name}</span><Badge tone={g.priority === 'High' ? 'red' : g.priority === 'Medium' ? 'amber' : 'slate'}>{g.priority}</Badge></div>
                  <div className="text-[11px] text-muted mt-1">{g.gap} points to go{!g.verified && ' · not yet verified'}</div>
                  <div className="flex gap-3 mt-2 text-[11px] font-bold"><Link className="text-brand" to={`/assessments/quiz/${g.skill.id}`}>Test</Link><Link className="text-brand" to="/learning">Learn</Link></div>
                </div>
              ))}
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
