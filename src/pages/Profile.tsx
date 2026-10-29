import { useEffect, useState } from 'react';
import { Card, CardHead, PageHeader, Btn, Field, inputCls, Badge, Progress } from '../components/ui';
import { useAuth } from '../store/AuthContext';
import { useData } from '../store/DataContext';
import { useToast } from '../store/ToastContext';
import { supabase } from '../lib/supabase';
import type { Profile as P } from '../lib/types';

export function Profile() {
  const { profile, updateProfile, session } = useAuth();
  const d = useData();
  const toast = useToast();
  const [f, setF] = useState<Partial<P>>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (profile) setF(profile); }, [profile?.id]);
  const set = (k: keyof P) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  // profile completeness is computed from what is actually filled in
  const fields = [profile?.full_name, profile?.college, profile?.education, profile?.grad_year, profile?.location, profile?.phone, profile?.bio, profile?.github, profile?.linkedin];
  const complete = Math.round((fields.filter(Boolean).length / fields.length) * 100 * 0.8 + (d.resumes.length ? 20 : 0));

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      await updateProfile({
        full_name: f.full_name || '', college: f.college, education: f.education, location: f.location, phone: f.phone, bio: f.bio, github: f.github, linkedin: f.linkedin,
        grad_year: f.grad_year ? Number(f.grad_year) : null,
      });
      toast('Profile saved');
    } catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'err'); }
    setBusy(false);
  }

  async function setClaim(skillId: string, level: number) {
    if (!session) return;
    if (level === 0) await supabase.from('skill_claims').delete().eq('user_id', session.user.id).eq('skill_id', skillId);
    else await supabase.from('skill_claims').upsert({ user_id: session.user.id, skill_id: skillId, level, updated_at: new Date().toISOString() });
    d.refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" sub="Keep your details current. Self-declared skill levels count only as unverified evidence (capped at 60%) until you pass a test." />
      <div className="grid xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHead title="Personal details" />
          <form onSubmit={save} className="px-5 pb-5 grid sm:grid-cols-2 gap-4">
            <Field label="Full name"><input className={inputCls} value={f.full_name ?? ''} onChange={set('full_name')} required /></Field>
            <Field label="Email"><input className={`${inputCls} bg-slate-50`} value={profile?.email ?? ''} disabled /></Field>
            <Field label="College / University"><input className={inputCls} value={f.college ?? ''} onChange={set('college')} /></Field>
            <Field label="Degree / Education"><input className={inputCls} value={f.education ?? ''} onChange={set('education')} placeholder="B.Tech CSE" /></Field>
            <Field label="Graduation year"><input type="number" className={inputCls} value={f.grad_year ?? ''} onChange={set('grad_year')} /></Field>
            <Field label="Location"><input className={inputCls} value={f.location ?? ''} onChange={set('location')} /></Field>
            <Field label="Phone"><input className={inputCls} value={f.phone ?? ''} onChange={set('phone')} /></Field>
            <Field label="GitHub"><input className={inputCls} value={f.github ?? ''} onChange={set('github')} placeholder="https://github.com/…" /></Field>
            <Field label="LinkedIn"><input className={inputCls} value={f.linkedin ?? ''} onChange={set('linkedin')} /></Field>
            <div className="sm:col-span-2"><Field label="Bio"><textarea rows={3} className={inputCls} value={f.bio ?? ''} onChange={set('bio')} /></Field></div>
            <div className="sm:col-span-2 flex justify-end"><Btn type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</Btn></div>
          </form>
        </Card>
        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex justify-between text-sm mb-2"><b className="text-navy">Profile completeness</b><span className="text-brand font-extrabold">{complete}%</span></div>
            <Progress value={complete} />
            <div className="text-[11px] text-muted mt-2">Fill every field and analyze a resume to reach 100%.</div>
          </Card>
          <Card>
            <CardHead title="Declare your skills" sub={`For ${d.domain?.role_title ?? 'your path'}`} />
            <div className="px-5 pb-5 space-y-3">
              {d.skills.map((s) => {
                const cur = d.claims.find((c) => c.skill_id === s.id)?.level ?? 0;
                return (
                  <div key={s.id} className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-navy">{s.name} {d.scores[s.id]?.verified && <Badge tone="teal">Verified</Badge>}</span>
                    <select className="text-xs border border-line rounded-lg px-2 py-1.5 bg-white" value={cur} onChange={(e) => setClaim(s.id, Number(e.target.value))}>
                      <option value={0}>—</option><option value={1}>Beginner</option><option value={2}>Intermediate</option><option value={3}>Advanced</option>
                    </select>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
