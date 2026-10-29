import type { Skill } from './types';

export interface ResumeResult {
  ats: number;
  breakdown: Record<string, number>;
  detected: Skill[];
  missingDomain: Skill[];
  suggestions: string[];
  stats: { words: number; metrics: number; sections: string[] };
}

const SECTION_PATTERNS: Record<string, RegExp> = {
  education: /\beducation\b|\bb\.?tech\b|\bbachelor|\bcgpa\b|\buniversity\b|\bcollege\b/i,
  experience: /\bexperience\b|\binternship\b|\bwork history\b|\bemployment\b/i,
  projects: /\bprojects?\b/i,
  skills: /\bskills?\b|\btechnologies\b|\btech stack\b/i,
  summary: /\bsummary\b|\bobjective\b|\bprofile\b|\babout me\b/i,
};

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function analyzeResume(text: string, domainSkills: Skill[]): ResumeResult {
  const clean = text.replace(/\s+/g, ' ').trim();
  const lower = clean.toLowerCase();
  const words = clean ? clean.split(' ').length : 0;

  // Skill detection: keyword match with word boundaries (handles c++, node.js, ci/cd)
  const detected = domainSkills.filter((s) =>
    [s.name, ...s.keywords].some((k) => {
      const kw = k.toLowerCase();
      return new RegExp(`(^|[^a-z0-9])${esc(kw)}($|[^a-z0-9])`, 'i').test(lower);
    }));
  const missingDomain = domainSkills.filter((s) => !detected.includes(s));

  const sections = Object.entries(SECTION_PATTERNS).filter(([, re]) => re.test(clean)).map(([k]) => k);
  const hasEmail = /[\w.+-]+@[\w-]+\.[\w.]+/.test(clean);
  const hasPhone = /(\+?\d[\d\s-]{8,}\d)/.test(clean);
  const hasLink = /(github\.com|linkedin\.com|portfolio|https?:\/\/)/i.test(clean);
  const metrics = (clean.match(/\b\d+(\.\d+)?\s?(%|x|k\b|\+|users|ms|lpa)|\b\d{2,}\b/gi) || []).length;
  const verbs = (clean.match(/\b(built|developed|designed|implemented|created|led|optimi[sz]ed|improved|reduced|increased|deployed|launched|automated|analy[sz]ed)\b/gi) || []).length;

  const skillScore = domainSkills.length ? (detected.length / domainSkills.length) * 100 : 0;
  const structure = (sections.length / Object.keys(SECTION_PATTERNS).length) * 100;
  const contact = ((hasEmail ? 50 : 0) + (hasPhone ? 25 : 0) + (hasLink ? 25 : 0));
  const impact = Math.min(100, metrics * 12 + verbs * 6);
  const length = words === 0 ? 0 : words < 150 ? (words / 150) * 70 : words <= 800 ? 100 : Math.max(40, 100 - (words - 800) / 10);

  const breakdown = {
    'Skill coverage': Math.round(skillScore),
    'Structure': Math.round(structure),
    'Impact & metrics': Math.round(impact),
    'Contact & links': Math.round(contact),
    'Length': Math.round(length),
  };
  const ats = Math.round(skillScore * 0.35 + structure * 0.2 + impact * 0.2 + contact * 0.15 + length * 0.1);

  const suggestions: string[] = [];
  if (!words) suggestions.push('No readable text was found. If this is a scanned PDF, paste the text instead.');
  if (!hasEmail) suggestions.push('Add a professional email address at the top.');
  if (!hasLink) suggestions.push('Include your GitHub / LinkedIn / portfolio links.');
  (['summary', 'experience', 'projects', 'skills', 'education'] as const).forEach((s) => {
    if (!sections.includes(s)) suggestions.push(`Add a clear "${s[0].toUpperCase() + s.slice(1)}" section.`);
  });
  if (metrics < 3) suggestions.push('Quantify results (e.g. “reduced load time by 40%”, “served 500+ users”).');
  if (verbs < 4) suggestions.push('Start bullets with strong action verbs: built, designed, optimised, deployed.');
  if (words > 800) suggestions.push('Trim to one or two pages — recruiters skim.');
  if (words > 0 && words < 150) suggestions.push('Your resume is very short; add projects and achievements.');
  if (missingDomain.length) suggestions.push(`Not detected for this career path: ${missingDomain.slice(0, 4).map((s) => s.name).join(', ')}. Add them only if you truly have the skill.`);

  return { ats, breakdown, detected, missingDomain, suggestions, stats: { words, metrics, sections } };
}

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) {
    const pdfjs = await import('pdfjs-dist');
    const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    let text = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((it) => ('str' in it ? it.str : '')).join(' ') + '\n';
    }
    return text;
  }
  if (name.endsWith('.txt') || name.endsWith('.md') || file.type.startsWith('text/')) return file.text();
  throw new Error('Unsupported file type. Upload a PDF or .txt, or paste your resume text.');
}
