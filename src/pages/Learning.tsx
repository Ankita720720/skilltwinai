import { useMemo, useState } from 'react';
import { ExternalLink, Check, Clock, Play, BookOpen, GraduationCap, Code2, FileText, ListVideo, Search } from 'lucide-react';
import { Card, PageHeader, Badge, Progress, Empty, inputCls } from '../components/ui';
import { useData } from '../store/DataContext';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';
import { supabase } from '../lib/supabase';
import { isYouTube, isYouTubePlaylist, isYouTubeSearch, useYouTubeThumb } from '../lib/youtube';
import type { Resource } from '../lib/types';

const KINDS = ['all', 'video', 'course', 'docs', 'practice', 'article'] as const;
const kindIcon = (k: string) => ({ video: Play, course: GraduationCap, docs: BookOpen, practice: Code2, article: FileText } as Record<string, typeof Play>)[k] ?? FileText;
const hostOf = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; } };
const fmtTime = (m: number) => (m >= 60 ? `${Math.round(m / 6) / 10}h` : `${m}m`);

/** 16:9 preview. YouTube links show the real thumbnail; everything else gets a branded tile. */
function Thumb({ r }: { r: Resource }) {
  const yt = isYouTube(r.url);
  const thumb = useYouTubeThumb(yt ? r.url : '');
  const [failed, setFailed] = useState(false);
  const Icon = kindIcon(r.kind);
  const playlist = isYouTubePlaylist(r.url);
  const search = isYouTubeSearch(r.url);

  return (
    <a href={r.url} target="_blank" rel="noreferrer" aria-label={`Open ${r.title}${yt ? ' on YouTube' : ''}`}
      className="group relative block aspect-video w-full overflow-hidden rounded-t-xl bg-slate-100">
      {yt && thumb && !failed ? (
        <img src={thumb} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
      ) : yt ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-white" style={{ background: 'linear-gradient(135deg,#7f1d1d,#dc2626)' }}>
          {search ? <Search className="h-6 w-6 opacity-90" /> : <Play className="h-7 w-7 opacity-90" />}
          <span className="text-[11px] font-bold tracking-wide">{search ? 'Search on YouTube' : 'YouTube'}</span>
        </div>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-white" style={{ background: 'linear-gradient(135deg,#0B1F3A,#5B2EFF)' }}>
          <Icon className="h-7 w-7 opacity-90" />
          <span className="flex items-center gap-1.5 text-[11px] font-semibold opacity-90">
            <img src={`https://www.google.com/s2/favicons?sz=32&domain=${hostOf(r.url)}`} alt="" className="h-4 w-4 rounded-sm bg-white/90 p-px" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            {hostOf(r.url) || r.provider}
          </span>
        </div>
      )}
      {yt && (
        <>
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/25">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white opacity-90 shadow-lg transition group-hover:scale-110 group-hover:opacity-100"><Play className="ml-0.5 h-5 w-5 fill-white" /></span>
          </span>
          {playlist && <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-white"><ListVideo className="h-3 w-3" /> Playlist</span>}
        </>
      )}
      <span className="absolute left-2 top-2 flex items-center gap-1 rounded bg-white/95 px-1.5 py-0.5 text-[10px] font-bold capitalize text-navy shadow-sm"><Icon className="h-3 w-3" />{yt ? 'YouTube' : r.kind}</span>
    </a>
  );
}

export function Learning() {
  const d = useData();
  const { session } = useAuth();
  const toast = useToast();
  const [skill, setSkill] = useState('all');
  const [kind, setKind] = useState<(typeof KINDS)[number]>('all');
  const [q, setQ] = useState('');

  // weakest skills first so the page is personalised to the learner's gaps
  const ordered = useMemo(() => Object.values(d.scores).sort((a, b) => a.score - b.score), [d.scores]);
  const list = ordered.filter((s) => skill === 'all' || s.skill.id === skill);

  async function toggle(id: string, title: string, done: boolean) {
    if (!session) return;
    if (done) await supabase.from('resource_progress').delete().eq('user_id', session.user.id).eq('resource_id', id);
    else {
      const { error } = await supabase.from('resource_progress').insert({ user_id: session.user.id, resource_id: id });
      if (error) return toast(error.message, 'err');
      await d.log('learn', `Completed “${title}”`, 3);
    }
    d.refresh();
  }

  const totalDone = d.resources.filter((r) => d.completedResourceIds.has(r.id)).length;
  const kindCount = (k: string) => (k === 'all' ? d.resources.length : d.resources.filter((r) => (k === 'video' ? r.kind === 'video' || isYouTube(r.url) : r.kind === k)).length);
  const matchKind = (r: Resource) => kind === 'all' || (kind === 'video' ? r.kind === 'video' || isYouTube(r.url) : r.kind === kind);

  let shown = 0;
  const blocks = list.map((s) => {
    const res = d.resources
      .filter((r) => r.skill_id === s.skill.id && matchKind(r) && (r.title + ' ' + r.provider).toLowerCase().includes(q.toLowerCase()))
      // videos first inside each skill
      .sort((a, b) => Number(isYouTube(b.url)) - Number(isYouTube(a.url)));
    if (!res.length) return null;
    shown += res.length;
    const all = d.resources.filter((r) => r.skill_id === s.skill.id);
    const done = all.filter((r) => d.completedResourceIds.has(r.id)).length;
    return (
      <Card key={s.skill.id} className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3"><h3 className="font-extrabold text-navy">{s.skill.name}</h3>{s.score < 45 && <Badge tone="red">Priority</Badge>}</div>
          <span className="text-xs text-muted">{done}/{all.length} done · score {s.score}%</span>
        </div>
        <Progress value={all.length ? (done / all.length) * 100 : 0} h="h-1.5" />
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
          {res.map((r) => {
            const ok = d.completedResourceIds.has(r.id);
            return (
              <div key={r.id} className={`border rounded-xl overflow-hidden flex flex-col ${ok ? 'border-teal/40 bg-teal-soft/40' : 'border-line bg-white'}`}>
                <Thumb r={r} />
                <div className="p-3.5 flex items-start gap-3 flex-1">
                  <button onClick={() => toggle(r.id, r.title, ok)} title={ok ? 'Mark as not done' : 'Mark complete'}
                    className={`w-6 h-6 rounded-md border mt-0.5 flex items-center justify-center shrink-0 ${ok ? 'bg-teal border-teal text-white' : 'border-slate-300 hover:border-teal bg-white'}`}>{ok && <Check className="w-3.5 h-3.5" />}</button>
                  <div className="flex-1 min-w-0">
                    <a href={r.url} target="_blank" rel="noreferrer" className="font-bold text-navy text-[13px] leading-snug hover:text-brand line-clamp-2">{r.title}<ExternalLink className="w-3 h-3 inline ml-1.5 -mt-0.5" /></a>
                    <div className="text-[11px] text-muted mt-1.5 flex items-center gap-2 flex-wrap"><span className="truncate max-w-[130px]">{r.provider}</span><Badge tone="purple">{r.kind}</Badge><span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtTime(r.minutes)}</span></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Learning Resources" sub="Videos and reading for each skill — your weakest skills come first. Click a thumbnail to open it on YouTube (or the source site) and tick it off to raise that skill's score."
        right={<div className="bg-white border border-line rounded-xl px-5 py-3 text-center"><div className="text-[10px] font-bold uppercase text-muted">Completed</div><div className="text-2xl font-extrabold text-brand">{totalDone}/{d.resources.length}</div></div>} />
      <div className="flex flex-wrap gap-3">
        <input className={`${inputCls} max-w-xs`} placeholder="Search resources…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={`${inputCls} max-w-[220px]`} value={skill} onChange={(e) => setSkill(e.target.value)}>
          <option value="all">All skills</option>
          {d.skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button key={k} onClick={() => setKind(k)} className={`text-xs font-bold px-3.5 py-1.5 rounded-full border capitalize ${kind === k ? 'bg-brand text-white border-brand' : 'bg-white border-line text-navy hover:border-brand'}`}>
            {k === 'all' ? 'All' : k === 'video' ? 'Videos' : k} <span className="opacity-60 ml-1">{kindCount(k)}</span>
          </button>
        ))}
      </div>
      {blocks}
      {d.resources.length === 0 && <Empty title="No resources for this path yet" />}
      {d.resources.length > 0 && shown === 0 && <Empty title="Nothing matches these filters" text="Try another type or clear the search box." />}
    </div>
  );
}