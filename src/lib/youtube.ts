import { useEffect, useState } from 'react';

/** Pulls the 11-character video id out of any common YouTube URL (watch, youtu.be, embed, shorts, live). */
export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, '');
    if (host === 'youtu.be') return u.pathname.slice(1, 12) || null;
    if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
      const v = u.searchParams.get('v');
      if (v && v.length === 11) return v;
      const m = u.pathname.match(/\/(embed|shorts|live|v)\/([\w-]{11})/);
      if (m) return m[2];
    }
  } catch { /* not a URL */ }
  return null;
}

export function isYouTube(url: string): boolean {
  try { return /(^|\.)youtube\.com$|(^|\.)youtu\.be$|(^|\.)youtube-nocookie\.com$/.test(new URL(url).hostname); } catch { return false; }
}

export const isYouTubePlaylist = (url: string) => { try { return isYouTube(url) && !!new URL(url).searchParams.get('list') && !youtubeId(url); } catch { return false; } };
export const isYouTubeSearch = (url: string) => { try { return isYouTube(url) && new URL(url).pathname.startsWith('/results'); } catch { return false; } };

export const thumbUrl = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

const CACHE = 'skilltwin.yt.thumb.v1';
function readCache(): Record<string, string> { try { return JSON.parse(localStorage.getItem(CACHE) || '{}'); } catch { return {}; } }
function writeCache(url: string, thumb: string) { try { const c = readCache(); c[url] = thumb; localStorage.setItem(CACHE, JSON.stringify(c)); } catch { /* storage full / blocked */ } }

/**
 * Returns a thumbnail URL for a YouTube link.
 *  - video links      → built straight from the id (no network call)
 *  - playlist links   → asked from YouTube's public oEmbed endpoint once, then cached in localStorage
 *  - search links     → null (the UI shows a branded tile instead)
 * `null` always means "show the fallback tile".
 */
export function useYouTubeThumb(url: string): string | null {
  const id = youtubeId(url);
  const direct = id ? thumbUrl(id) : null;
  const [oembed, setOembed] = useState<string | null>(() => (direct ? null : readCache()[url] ?? null));

  useEffect(() => {
    if (direct || !isYouTubePlaylist(url) || oembed) return;
    let cancelled = false;
    fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { thumbnail_url?: string } | null) => { if (!cancelled && j?.thumbnail_url) { setOembed(j.thumbnail_url); writeCache(url, j.thumbnail_url); } })
      .catch(() => { /* offline / blocked → fallback tile */ });
    return () => { cancelled = true; };
  }, [url, direct, oembed]);

  return direct ?? oembed;
}