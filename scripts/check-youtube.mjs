// Checks every YouTube link in the seed files and prints the real video title for each one,
// so you can confirm the right video is behind each link (and spot any that no longer exist).
//
//   node scripts/check-youtube.mjs            → checks supabase/seed.sql + supabase/seed_update.sql
//   node scripts/check-youtube.mjs --dry      → only lists the links (no network)
//
// Needs Node 18+. YouTube *search* links are skipped (they always work).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = ['supabase/seed.sql', 'supabase/seed_update.sql'].map((f) => path.join(root, f)).filter((f) => fs.existsSync(f));
const dry = process.argv.includes('--dry');

const urls = new Set();
for (const f of files) for (const m of fs.readFileSync(f, 'utf8').matchAll(/'(https:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^']+)'/g)) urls.add(m[1]);
const list = [...urls].filter((u) => !u.includes('/results?'));
console.log(`Found ${list.length} YouTube video/playlist links${dry ? ' (dry run)' : ''}\n`);

let bad = 0;
for (const u of list) {
  if (dry) { console.log('•', u); continue; }
  try {
    const r = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(u)}`);
    if (!r.ok) { bad++; console.log(`✗ DEAD (${r.status})  ${u}`); continue; }
    const j = await r.json();
    console.log(`✓ ${j.title}  —  ${j.author_name}\n    ${u}`);
  } catch (e) { bad++; console.log(`? could not check  ${u}  (${e.message})`); }
}
if (!dry) console.log(bad ? `\n${bad} link(s) need fixing. Edit the URL in the resources list of supabase/seed_update.sql (or in Supabase → Table editor → resources).` : '\nAll links resolve.');
