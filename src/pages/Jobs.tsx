import { useMemo, useState } from 'react';
import { MapPin, Bookmark, BookmarkCheck, Send, Plus, SlidersHorizontal, X, ExternalLink, Trash2 } from 'lucide-react';
import { Card, PageHeader, Badge, Progress, Btn, Modal, Empty, Field, inputCls, timeAgo, scoreColor } from '../components/ui';
import { useData } from '../store/DataContext';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';
import { supabase } from '../lib/supabase';
import { matchLabel, type JobMatch } from '../lib/engine';

type Sort = 'match' | 'newest';
const blank = { company: '', title: '', url: '', location: '', work_type: 'On-site', level: 'Entry Level', salary: '', description: '', skills: [] as string[] };

function cleanUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`);
    return (u.protocol === 'http:' || u.protocol === 'https:') && u.hostname.includes('.') ? u.toString() : null;
  } catch { return null; }
}

/** Direct company link when we have one; otherwise a targeted search for the company's live openings. */
const searchLink = (company: string, title: string) => `https://www.google.com/search?q=${encodeURIComponent(`${company} careers ${title} apply`)}`;

export function Jobs() {
  const d = useData();
  const { session } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState<'all' | 'saved' | 'applied'>('all');
  const [q, setQ] = useState('');
  const [type, setType] = useState('All');
  const [level, setLevel] = useState('All');
  const [minMatch, setMinMatch] = useState(0);
  const [source, setSource] = useState<'all' | 'curated' | 'mine'>('all');
  const [sort, setSort] = useState<Sort>('match');
  const [showFilters, setShowFilters] = useState(false);
  const [open, setOpen] = useState<JobMatch | null>(null);
  const [note, setNote] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const out = d.jobMatches.filter((m) =>
      (tab === 'all' || m.status === tab) &&
      (type === 'All' || m.job.work_type === type) && (level === 'All' || m.job.level === level) &&
      m.match >= minMatch &&
      (source === 'all' || (source === 'mine' ? !!m.job.created_by : !m.job.created_by)) &&
      (!s || `${m.job.title} ${m.job.company} ${m.job.location}`.toLowerCase().includes(s)));
    if (sort === 'newest') out.sort((a, b) => b.job.posted_at.localeCompare(a.job.posted_at));
    return out;
  }, [d.jobMatches, tab, type, level, minMatch, source, sort, q]);

  const activeFilters = (type !== 'All' ? 1 : 0) + (level !== 'All' ? 1 : 0) + (minMatch > 0 ? 1 : 0) + (source !== 'all' ? 1 : 0) + (sort !== 'match' ? 1 : 0);
  const reset = () => { setQ(''); setType('All'); setLevel('All'); setMinMatch(0); setSource('all'); setSort('match'); };

  async function setStatus(m: JobMatch, status: 'saved' | 'applied' | null, noteText = '') {
    if (!session) return;
    if (status === null) await supabase.from('job_actions').delete().eq('user_id', session.user.id).eq('job_id', m.job.id);
    else {
      const { error } = await supabase.from('job_actions').upsert({ user_id: session.user.id, job_id: m.job.id, status, note: noteText, updated_at: new Date().toISOString() });
      if (error) return toast(error.message, 'err');
      await d.log('job', `${status === 'applied' ? 'Applied to' : 'Saved'} ${m.job.title} at ${m.job.company}`, status === 'applied' ? 5 : 1);
    }
    d.refresh();
  }

  async function addOpportunity() {
    if (!session || !d.domain) return;
    const company = form.company.trim(), title = form.title.trim();
    if (!company || !title) return toast('Company and job role are required.', 'err');
    const url = cleanUrl(form.url);
    if (!url) return toast('Enter a valid job link (e.g. https://company.com/careers/123).', 'err');
    setSaving(true);
    const { error } = await supabase.from('jobs').insert({
      domain_id: d.domain.id, title, company, location: form.location.trim() || 'Not specified', work_type: form.work_type, level: form.level,
      salary: form.salary.trim() || null, required_skills: form.skills, description: form.description.trim(),
      apply_url: url, source: 'user', created_by: session.user.id,
    });
    setSaving(false);
    if (error) return toast(error.message, 'err');
    await d.log('job', `Added opportunity: ${title} at ${company}`, 2);
    toast('Opportunity added to your matches.');
    setAdding(false); setForm(blank); d.refresh();
  }

  async function removeOwn(m: JobMatch) {
    if (!session || !m.job.created_by) return;
    if (!window.confirm(`Remove "${m.job.title}" at ${m.job.company}?`)) return;
    const { error } = await supabase.from('jobs').delete().eq('id', m.job.id).eq('created_by', session.user.id);
    if (error) return toast(error.message, 'err');
    toast('Opportunity removed.');
    d.refresh();
  }

  const toggleSkill = (slug: string) => setForm((f) => ({ ...f, skills: f.skills.includes(slug) ? f.skills.filter((x) => x !== slug) : [...f.skills, slug] }));
  const counts = { all: d.jobMatches.length, saved: d.jobMatches.filter((m) => m.status === 'saved').length, applied: d.jobMatches.filter((m) => m.status === 'applied').length };

  return (
    <div className="space-y-5">
      <PageHeader title="Job Matches" sub="Match % = how close your verified skill scores are to each role's required skills. Apply opens the employer's own careers page — found a specific opening? Add it as your own opportunity card."
        right={<Btn onClick={() => { setForm(blank); setAdding(true); }}><Plus className="w-4 h-4" /> Add opportunity</Btn>} />

      <div className="space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex bg-white border border-line rounded-lg p-1">{(['all', 'saved', 'applied'] as const).map((t) => <button key={t} onClick={() => setTab(t)} className={`text-xs font-bold px-3.5 py-1.5 rounded-md capitalize ${tab === t ? 'bg-brand text-white' : 'text-navy'}`}>{t} ({counts[t]})</button>)}</div>
          <input className={`${inputCls} max-w-xs`} placeholder="Search title, company, city…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Btn variant="ghost" className="!py-2 !text-xs" onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}>
            <SlidersHorizontal className="w-4 h-4" /> Filters{activeFilters > 0 && <span className="ml-1 bg-brand text-white rounded-full text-[10px] px-1.5">{activeFilters}</span>}
          </Btn>
        </div>
        {showFilters && (
          <Card className="p-4 flex flex-wrap gap-4 items-end fade-up">
            <label className="block"><span className="block text-[11px] font-bold text-navy mb-1">Work type</span>
              <select className={`${inputCls} min-w-[130px]`} value={type} onChange={(e) => setType(e.target.value)}>{['All', 'Remote', 'Hybrid', 'On-site'].map((x) => <option key={x}>{x}</option>)}</select></label>
            <label className="block"><span className="block text-[11px] font-bold text-navy mb-1">Level</span>
              <select className={`${inputCls} min-w-[150px]`} value={level} onChange={(e) => setLevel(e.target.value)}>{['All', 'Internship', 'Entry Level', 'Mid Level'].map((x) => <option key={x}>{x}</option>)}</select></label>
            <label className="block"><span className="block text-[11px] font-bold text-navy mb-1">Minimum match</span>
              <select className={`${inputCls} min-w-[130px]`} value={minMatch} onChange={(e) => setMinMatch(Number(e.target.value))}>
                <option value={0}>Any</option><option value={40}>40%+</option><option value={65}>65%+</option><option value={85}>85%+</option></select></label>
            <label className="block"><span className="block text-[11px] font-bold text-navy mb-1">Source</span>
              <select className={`${inputCls} min-w-[150px]`} value={source} onChange={(e) => setSource(e.target.value as typeof source)}>
                <option value="all">All listings</option><option value="curated">Company careers pages</option><option value="mine">Added by me</option></select></label>
            <label className="block"><span className="block text-[11px] font-bold text-navy mb-1">Sort by</span>
              <select className={`${inputCls} min-w-[130px]`} value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                <option value="match">Best match</option><option value="newest">Newest</option></select></label>
            <Btn variant="ghost" className="!py-2 !text-xs" onClick={reset}><X className="w-4 h-4" /> Reset all</Btn>
          </Card>
        )}
        <div className="text-[11px] text-muted">Showing {list.length} of {d.jobMatches.length} opportunities</div>
      </div>

      {list.length === 0 && <Card><Empty title="No jobs match these filters" text="Clear the filters, or add an opportunity you found yourself." action={<Btn variant="ghost" onClick={reset}>Reset filters</Btn>} /></Card>}

      <div className="grid lg:grid-cols-2 gap-5">
        <button onClick={() => { setForm(blank); setAdding(true); }} className="border-2 border-dashed border-line hover:border-brand hover:bg-brand-soft/40 transition rounded-2xl p-5 min-h-[160px] flex flex-col items-center justify-center text-center text-muted hover:text-brand">
          <div className="w-11 h-11 rounded-full bg-brand-soft text-brand flex items-center justify-center mb-2"><Plus className="w-5 h-5" /></div>
          <div className="font-extrabold text-navy">Add a new opportunity</div>
          <div className="text-xs mt-1 max-w-[260px]">Paste a company, role and link — we'll match it against your skills.</div>
        </button>

        {list.map((m) => (
          <Card key={m.job.id} className="p-5 flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-extrabold text-navy">{m.job.title}</h3>
                <div className="text-xs text-muted flex items-center gap-2 flex-wrap">{m.job.company}{m.job.created_by ? <Badge tone="purple">Added by you</Badge> : <Badge tone="slate">Careers page</Badge>}</div>
              </div>
              <div className="text-right shrink-0"><div className="text-xl font-extrabold" style={{ color: scoreColor(m.match) }}>{m.match}%</div><div className="text-[10px] font-bold uppercase text-muted">{matchLabel(m.match)}</div></div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted mt-2"><span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{m.job.location}</span><span>{m.job.work_type}</span><span>{m.job.level}</span>{m.job.salary && <span className="font-semibold text-navy">{m.job.salary}</span>}<span>{timeAgo(m.job.posted_at)}</span></div>
            {m.job.description && <p className="text-xs text-muted mt-3">{m.job.description}</p>}
            <div className="mt-3"><Progress value={m.match} h="h-1.5" /></div>
            <div className="flex flex-wrap gap-1.5 mt-3">{m.matched.map((s) => <Badge key={s.id} tone="teal">✓ {s.name}</Badge>)}{m.missing.map((s) => <Badge key={s.id} tone="amber">Gap: {s.name}</Badge>)}</div>
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-line">
              <Btn variant="ghost" className="!py-2 !text-xs" onClick={() => setStatus(m, m.status === 'saved' ? null : 'saved')} disabled={m.status === 'applied'}>
                {m.status === 'saved' ? <><BookmarkCheck className="w-4 h-4 text-brand" /> Saved</> : <><Bookmark className="w-4 h-4" /> Save</>}</Btn>
              <a href={m.job.apply_url || searchLink(m.job.company, m.job.title)} target="_blank" rel="noreferrer noopener"
                onClick={() => { if (m.status !== 'applied') { setOpen(m); setNote(''); } }}
                className="inline-flex items-center justify-center gap-2 rounded-[9px] px-4 py-2 text-xs font-bold transition bg-brand text-white hover:bg-brand-dark">
                <Send className="w-4 h-4" /> {m.job.apply_url ? 'Apply on company site' : 'Find & apply'} <ExternalLink className="w-3.5 h-3.5" />
              </a>
              {m.status === 'applied' && <Badge tone="green">✓ Applied</Badge>}
              <a className="text-[11px] font-bold text-muted hover:text-brand ml-auto" href={searchLink(m.job.company, m.job.title)} target="_blank" rel="noreferrer noopener">Search live openings ↗</a>
              {m.job.created_by && <button onClick={() => removeOwn(m)} className="text-muted hover:text-red-600 p-1.5" title="Remove my opportunity" aria-label="Remove my opportunity"><Trash2 className="w-4 h-4" /></button>}
            </div>
          </Card>
        ))}
      </div>

      <Modal open={!!open} onClose={() => setOpen(null)} title="Did you apply?">
        {open && (
          <div className="space-y-4">
            <p className="text-sm text-muted">We opened <b className="text-navy">{open.job.company}</b>'s page for <b className="text-navy">{open.job.title}</b> in a new tab. If you submitted an application, track it here. Your match for this role is <b className="text-navy">{open.match}%</b>{open.missing.length > 0 && <> — consider closing: {open.missing.map((s) => s.name).join(', ')}</>}.</p>
            <textarea className={inputCls} rows={3} placeholder="Notes (referral, date, contact…)" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="flex gap-3 justify-end">
              <Btn variant="ghost" onClick={() => setOpen(null)}>Not yet</Btn>
              <Btn onClick={async () => { await setStatus(open, 'applied', note); setOpen(null); toast('Application tracked.'); }}>Yes, mark as applied</Btn>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={adding} onClose={() => setAdding(false)} title="Add a new opportunity">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Company name *"><input className={inputCls} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="e.g. Tata Motors" maxLength={80} /></Field>
            <Field label="Job role *"><input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Design Engineer" maxLength={100} /></Field>
          </div>
          <Field label="Job / careers link *"><input className={inputCls} inputMode="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" /></Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Location"><input className={inputCls} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="City or Remote" maxLength={80} /></Field>
            <Field label="Salary (optional)"><input className={inputCls} value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} placeholder="e.g. ₹5–7 LPA" maxLength={40} /></Field>
            <Field label="Work type"><select className={inputCls} value={form.work_type} onChange={(e) => setForm({ ...form, work_type: e.target.value })}>{['On-site', 'Hybrid', 'Remote'].map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Level"><select className={inputCls} value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>{['Internship', 'Entry Level', 'Mid Level'].map((x) => <option key={x}>{x}</option>)}</select></Field>
          </div>
          <Field label="Skills required (pick from your path — used to compute the match)">
            <div className="flex flex-wrap gap-2">
              {d.skills.map((s) => {
                const on = form.skills.includes(s.slug);
                return <button type="button" key={s.id} onClick={() => toggleSkill(s.slug)} className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${on ? 'bg-brand text-white border-brand' : 'bg-white text-navy border-line hover:border-brand'}`}>{s.name}</button>;
              })}
            </div>
          </Field>
          <Field label="Description / notes (optional)"><textarea className={inputCls} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={500} /></Field>
          <p className="text-[11px] text-muted">Only you can see opportunities you add. They're saved under {d.domain?.name}.</p>
          <div className="flex justify-end gap-3">
            <Btn variant="ghost" onClick={() => setAdding(false)}>Cancel</Btn>
            <Btn onClick={addOpportunity} disabled={saving}>{saving ? 'Adding…' : 'Add opportunity'}</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
