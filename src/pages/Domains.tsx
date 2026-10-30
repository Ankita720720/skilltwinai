import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Search, SlidersHorizontal, X } from 'lucide-react';
import { Card, Btn, Badge, Empty, inputCls } from '../components/ui';
import { useAuth } from '../store/AuthContext';
import { useData } from '../store/DataContext';
import { HeroCard, heroPrimary, heroGhost } from '../components/HeroCard';
import { useToast } from '../store/ToastContext';

const TECH_FALLBACK = ['fullstack', 'data', 'aiml'];
const CATS = [
  { id: 'all', label: 'All paths' },
  { id: 'tech', label: 'IT & Software' },
  { id: 'core', label: 'Core Engineering' },
];

export function Domains() {
  const { profile, updateProfile } = useAuth();
  const d = useData();
  const { domains } = d;
  const toast = useToast();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [sort, setSort] = useState<'default' | 'az'>('default');
  const [showFilters, setShowFilters] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const catOf = (id: string, c?: string) => c ?? (TECH_FALLBACK.includes(id) ? 'tech' : 'core');

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const out = domains.filter((dm) =>
      (cat === 'all' || catOf(dm.id, dm.category) === cat) &&
      (!s || `${dm.name} ${dm.role_title} ${dm.description}`.toLowerCase().includes(s)));
    if (sort === 'az') out.sort((a, b) => a.name.localeCompare(b.name));
    return out;
  }, [domains, q, cat, sort]);

  const activeFilters = (cat !== 'all' ? 1 : 0) + (sort !== 'default' ? 1 : 0);
  const reset = () => { setQ(''); setCat('all'); setSort('default'); };

  async function choose(id: string) {
    setBusy(id);
    try {
      await updateProfile({ domain_id: id });
      toast('Career path updated. Your progress in other paths is kept.');
      nav('/dashboard');
    } catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'err'); }
    finally { setBusy(null); }
  }

  return (
    <div className="space-y-5">
      {d.domain ? (
        <HeroCard eyebrow="✦ Your current career path" ring={d.readiness}
          title={<>{d.domain.icon} {d.domain.name}</>}
          stats={[{ label: 'Skills', value: d.skills.length }, { label: 'Verified', value: Object.values(d.scores).filter((s) => s.verified).length }, { label: 'Open roles', value: d.jobs.length }, { label: 'Projects', value: d.projects.length }]}
          actions={<><Link to="/dashboard" className={heroPrimary}>Go to dashboard</Link><Link to="/skill-gap" className={heroGhost}>View skill gap</Link></>}>
          Target role: <strong className="text-white">{d.domain.role_title}</strong>. {d.domain.description} Switching paths never deletes your earlier results.
        </HeroCard>
      ) : (
        <HeroCard eyebrow="✦ Get started"
          title="Choose the career path you want to be job-ready for"
          stats={[{ label: 'Paths', value: domains.length }, { label: 'IT & Software', value: domains.filter((x) => catOf(x.id, x.category) === 'tech').length }, { label: 'Core branches', value: domains.filter((x) => catOf(x.id, x.category) === 'core').length }]}>
          Your skills, gaps, roadmap, resources, projects and job matches are all built around this choice. You can switch any time — earlier results are kept.
        </HeroCard>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input className={`${inputCls} !pl-9`} placeholder="Search a branch or role… (e.g. civil, EV, data)" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex bg-white border border-line rounded-lg p-1 overflow-x-auto">
            {CATS.map((c) => (
              <button key={c.id} onClick={() => setCat(c.id)} className={`text-xs font-bold px-3.5 py-1.5 rounded-md whitespace-nowrap ${cat === c.id ? 'bg-brand text-white' : 'text-navy'}`}>{c.label}</button>
            ))}
          </div>
          <Btn variant="ghost" className="!py-2 !text-xs" onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}>
            <SlidersHorizontal className="w-4 h-4" /> Filters{activeFilters > 0 && <span className="ml-1 bg-brand text-white rounded-full text-[10px] px-1.5">{activeFilters}</span>}
          </Btn>
        </div>

        {showFilters && (
          <Card className="p-4 flex flex-wrap gap-4 items-end fade-up">
            <label className="block"><span className="block text-[11px] font-bold text-navy mb-1">Sort by</span>
              <select className={`${inputCls} min-w-[170px]`} value={sort} onChange={(e) => setSort(e.target.value as 'default' | 'az')}>
                <option value="default">Recommended order</option><option value="az">Name (A–Z)</option>
              </select></label>
            <Btn variant="ghost" className="!py-2 !text-xs" onClick={reset}><X className="w-4 h-4" /> Reset all</Btn>
          </Card>
        )}
        <div className="text-[11px] text-muted">{list.length} of {domains.length} career paths</div>
      </div>

      {list.length === 0 && <Card><Empty title="No career path matches" text="Try a different keyword or clear the filters." action={<Btn variant="ghost" onClick={reset}>Clear filters</Btn>} /></Card>}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {list.map((dm) => {
          const active = dm.id === profile?.domain_id;
          const c = catOf(dm.id, dm.category);
          return (
            <Card key={dm.id} className={`p-6 flex flex-col ${active ? 'ring-2 ring-brand' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="text-4xl mb-3">{dm.icon}</div>
                <Badge tone={c === 'tech' ? 'purple' : 'teal'}>{c === 'tech' ? 'IT & Software' : 'Core branch'}</Badge>
              </div>
              <div className="flex items-center gap-2 flex-wrap"><h3 className="font-extrabold text-navy text-lg">{dm.name}</h3>{active && <Badge tone="purple">Current</Badge>}</div>
              <div className="text-[11px] font-semibold text-brand mt-0.5">{dm.role_title}</div>
              <p className="text-sm text-muted mt-1.5 flex-1">{dm.description}</p>
              {dm.avg_salary && <div className="text-xs text-muted mt-3">Typical entry pay: <b className="text-navy">{dm.avg_salary}</b></div>}
              <Btn className="mt-4" variant={active ? 'ghost' : 'primary'} disabled={active || busy === dm.id} onClick={() => choose(dm.id)}>
                {active ? <><Check className="w-4 h-4" /> Selected</> : busy === dm.id ? 'Switching…' : 'Choose this path'}
              </Btn>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
