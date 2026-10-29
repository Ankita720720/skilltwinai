import { useState } from 'react';
import { MapPin, Bookmark, BookmarkCheck, Send } from 'lucide-react';
import { Card, PageHeader, Badge, Progress, Btn, Modal, Empty, inputCls, timeAgo, scoreColor } from '../components/ui';
import { useData } from '../store/DataContext';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';
import { supabase } from '../lib/supabase';
import { matchLabel, type JobMatch } from '../lib/engine';

export function Jobs() {
  const d = useData();
  const { session } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState<'all' | 'saved' | 'applied'>('all');
  const [q, setQ] = useState('');
  const [type, setType] = useState('All');
  const [level, setLevel] = useState('All');
  const [open, setOpen] = useState<JobMatch | null>(null);
  const [note, setNote] = useState('');

  const list = d.jobMatches.filter((m) =>
    (tab === 'all' || m.status === tab) &&
    (type === 'All' || m.job.work_type === type) && (level === 'All' || m.job.level === level) &&
    (`${m.job.title} ${m.job.company} ${m.job.location}`.toLowerCase().includes(q.toLowerCase())));

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
  const counts = { all: d.jobMatches.length, saved: d.jobMatches.filter((m) => m.status === 'saved').length, applied: d.jobMatches.filter((m) => m.status === 'applied').length };

  return (
    <div className="space-y-5">
      <PageHeader title="Job Matches" sub="Match % = how close your verified skill scores are to each role's required skills. Listings are managed in the database — replace the seed rows with your own feed or API." />
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex bg-white border border-line rounded-lg p-1">{(['all', 'saved', 'applied'] as const).map((t) => <button key={t} onClick={() => setTab(t)} className={`text-xs font-bold px-3.5 py-1.5 rounded-md capitalize ${tab === t ? 'bg-brand text-white' : 'text-navy'}`}>{t} ({counts[t]})</button>)}</div>
        <input className={`${inputCls} max-w-xs`} placeholder="Search title, company, city…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={`${inputCls} max-w-[150px]`} value={type} onChange={(e) => setType(e.target.value)}>{['All', 'Remote', 'Hybrid', 'On-site'].map((x) => <option key={x}>{x}</option>)}</select>
        <select className={`${inputCls} max-w-[170px]`} value={level} onChange={(e) => setLevel(e.target.value)}>{['All', 'Internship', 'Entry Level', 'Mid Level'].map((x) => <option key={x}>{x}</option>)}</select>
      </div>
      {list.length === 0 && <Card><Empty title="No jobs match these filters" /></Card>}
      <div className="grid lg:grid-cols-2 gap-5">
        {list.map((m) => (
          <Card key={m.job.id} className="p-5 flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <div><h3 className="font-extrabold text-navy">{m.job.title}</h3><div className="text-xs text-muted">{m.job.company}</div></div>
              <div className="text-right"><div className="text-xl font-extrabold" style={{ color: scoreColor(m.match) }}>{m.match}%</div><div className="text-[10px] font-bold uppercase text-muted">{matchLabel(m.match)}</div></div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted mt-2"><span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{m.job.location}</span><span>{m.job.work_type}</span><span>{m.job.level}</span>{m.job.salary && <span className="font-semibold text-navy">{m.job.salary}</span>}<span>{timeAgo(m.job.posted_at)}</span></div>
            <p className="text-xs text-muted mt-3">{m.job.description}</p>
            <div className="mt-3"><Progress value={m.match} h="h-1.5" /></div>
            <div className="flex flex-wrap gap-1.5 mt-3">{m.matched.map((s) => <Badge key={s.id} tone="teal">✓ {s.name}</Badge>)}{m.missing.map((s) => <Badge key={s.id} tone="amber">Gap: {s.name}</Badge>)}</div>
            <div className="flex gap-2 mt-4 pt-4 border-t border-line">
              <Btn variant="ghost" className="!py-2 !text-xs" onClick={() => setStatus(m, m.status === 'saved' ? null : 'saved')} disabled={m.status === 'applied'}>
                {m.status === 'saved' ? <><BookmarkCheck className="w-4 h-4 text-brand" /> Saved</> : <><Bookmark className="w-4 h-4" /> Save</>}</Btn>
              {m.status === 'applied' ? <Badge tone="green">✓ Applied</Badge> : <Btn className="!py-2 !text-xs" onClick={() => { setOpen(m); setNote(''); }}><Send className="w-4 h-4" /> Apply</Btn>}
            </div>
          </Card>
        ))}
      </div>
      <Modal open={!!open} onClose={() => setOpen(null)} title={`Apply: ${open?.job.title ?? ''}`}>
        {open && (
          <div className="space-y-4">
            <p className="text-sm text-muted">Your match for this role is <b className="text-navy">{open.match}%</b>. {open.missing.length > 0 && <>Consider closing: {open.missing.map((s) => s.name).join(', ')}.</>}</p>
            <textarea className={inputCls} rows={4} placeholder="Notes / cover note (kept in your tracker)" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="flex gap-3 justify-end">
              {open.job.apply_url && <a className="text-xs font-bold text-brand self-center" href={open.job.apply_url} target="_blank" rel="noreferrer">Open company page ↗</a>}
              <Btn onClick={async () => { await setStatus(open, 'applied', note); setOpen(null); toast('Application tracked.'); }}>Mark as applied</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
