import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Card, PageHeader, Btn, Badge } from '../components/ui';
import { useAuth } from '../store/AuthContext';
import { useData } from '../store/DataContext';
import { useToast } from '../store/ToastContext';

export function Domains() {
  const { profile, updateProfile } = useAuth();
  const { domains } = useData();
  const toast = useToast();
  const nav = useNavigate();

  async function choose(id: string) {
    try {
      await updateProfile({ domain_id: id });
      toast('Career path updated. Your progress in other paths is kept.');
      nav('/dashboard');
    } catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'err'); }
  }
  return (
    <div>
      <PageHeader title={profile?.domain_id ? 'Career domain' : 'Choose your career path'} sub="Your skills, gaps, roadmap, resources, projects and job matches are all built around this choice. You can switch any time — earlier results are kept." />
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {domains.map((dm) => {
          const active = dm.id === profile?.domain_id;
          return (
            <Card key={dm.id} className={`p-6 flex flex-col ${active ? 'ring-2 ring-brand' : ''}`}>
              <div className="text-4xl mb-3">{dm.icon}</div>
              <div className="flex items-center gap-2"><h3 className="font-extrabold text-navy text-lg">{dm.name}</h3>{active && <Badge tone="purple">Current</Badge>}</div>
              <p className="text-sm text-muted mt-1.5 flex-1">{dm.description}</p>
              {dm.avg_salary && <div className="text-xs text-muted mt-3">Typical entry pay: <b className="text-navy">{dm.avg_salary}</b></div>}
              <Btn className="mt-4" variant={active ? 'ghost' : 'primary'} disabled={active} onClick={() => choose(dm.id)}>
                {active ? <><Check className="w-4 h-4" /> Selected</> : 'Choose this path'}
              </Btn>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
