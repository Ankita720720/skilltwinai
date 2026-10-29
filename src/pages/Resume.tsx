import { useRef, useState } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  FileCheck2,
  LoaderCircle,
  X,
} from 'lucide-react';
import {
  Card,
  CardHead,
  PageHeader,
  Btn,
  Progress,
  Badge,
  Ring,
  Empty,
  timeAgo,
} from '../components/ui';
import { useData } from '../store/DataContext';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';
import { supabase } from '../lib/supabase';
import {
  analyzeResume,
  extractTextFromFile,
  type ResumeResult,
} from '../lib/resume';

export function Resume() {
  const d = useData();
  const { session } = useAuth();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('Pasted resume');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ResumeResult | null>(null);

  async function onFile(f?: File) {
    if (!f) return;

    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'text/markdown',
    ];

    const hasAllowedExtension = /\.(pdf|txt|md)$/i.test(f.name);

    if (!hasAllowedExtension && !allowedTypes.includes(f.type)) {
      toast('Please select a PDF, TXT, or Markdown file.', 'err');
      return;
    }

    try {
      setBusy(true);
      const extractedText = await extractTextFromFile(f);

      setText(extractedText);
      setFileName(f.name);
      setResult(null);

      toast('Text extracted — review it and click Analyze.');
    } catch (e) {
      toast(
        e instanceof Error ? e.message : 'Could not read file',
        'err',
      );
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function analyze() {
    if (text.trim().length < 40) {
      toast('Add more resume text first.', 'err');
      return;
    }

    setBusy(true);

    try {
      const r = analyzeResume(text, d.skills);
      setResult(r);

      if (session) {
        const { error } = await supabase.from('resume_analyses').insert({
          user_id: session.user.id,
          file_name: fileName,
          raw_text: text.slice(0, 50000),
          detected_skill_ids: r.detected.map((s) => s.id),
          ats_score: r.ats,
          breakdown: r.breakdown,
          suggestions: r.suggestions,
        });

        if (error) {
          toast(error.message, 'err');
        } else {
          await d.log('resume', `Analyzed resume (${r.ats}% ATS)`, 10);
          await d.refresh();
        }
      }
    } catch (e) {
      toast(
        e instanceof Error ? e.message : 'Could not analyze resume.',
        'err',
      );
    } finally {
      setBusy(false);
    }
  }

  const latest = d.resumes[0];

  const scoreStatus = (score: number) => {
    if (score >= 70) {
      return {
        label: 'Strong match',
        description: 'Your resume covers many skills for this path.',
        color: 'text-emerald-700',
        background: 'bg-emerald-50 border-emerald-200',
        dot: 'bg-emerald-500',
      };
    }

    if (score >= 45) {
      return {
        label: 'Room to improve',
        description: 'A few targeted changes could improve your match.',
        color: 'text-amber-700',
        background: 'bg-amber-50 border-amber-200',
        dot: 'bg-amber-500',
      };
    }

    return {
      label: 'Needs attention',
      description: 'Review the suggestions below to strengthen your resume.',
      color: 'text-rose-700',
      background: 'bg-rose-50 border-rose-200',
      dot: 'bg-rose-500',
    };
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resume Analyzer"
        sub={`Upload a PDF/text resume or paste it. We detect which ${d.domain?.role_title
          } skills you mention and score ATS-readiness. Detected skills count as unverified until you pass a test.`}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 lg:gap-6">
        {/* Resume input */}
        <Card className="xl:col-span-2 overflow-hidden">
          <CardHead title="Your resume" />

          <div className="px-4 sm:px-5 pb-5 space-y-5">
            {/* Upload area */}
            <div
              role="button"
              tabIndex={0}
              aria-label="Upload your resume"
              onClick={() => {
                if (!busy) fileRef.current?.click();
              }}
              onKeyDown={(e) => {
                if (!busy && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  fileRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!busy) void onFile(e.dataTransfer.files[0]);
              }}
              className="group border-2 border-dashed border-line hover:border-brand focus-visible:border-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/10 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-colors bg-canvas/50 hover:bg-brand/5"
            >
              <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                {busy ? (
                  <LoaderCircle className="w-7 h-7 text-brand animate-spin" />
                ) : (
                  <UploadCloud className="w-7 h-7 text-brand" />
                )}
              </div>

              <div className="font-bold text-navy text-sm sm:text-base">
                {busy ? 'Processing...' : 'Drop your resume here'}
              </div>

              <div className="text-sm text-muted mt-1">
                or click to browse your files
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <span className="px-2.5 py-1 rounded-lg bg-surface border border-line text-[11px] font-bold text-muted">
                  PDF
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-surface border border-line text-[11px] font-bold text-muted">
                  TXT
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-surface border border-line text-[11px] font-bold text-muted">
                  MD
                </span>
              </div>

              <p className="text-[11px] text-muted mt-3">
                Resume text is extracted in your browser.
              </p>

              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
                hidden
                disabled={busy}
                onChange={(e) => void onFile(e.target.files?.[0])}
              />
            </div>

            {/* Selected file */}
            {fileName !== 'Pasted resume' && (
              <div className="flex items-center gap-3 rounded-xl border border-line bg-canvas/50 p-3">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-brand/10 flex items-center justify-center">
                  <FileCheck2 className="w-5 h-5 text-brand" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-navy truncate">
                    {fileName}
                  </div>
                  <div className="text-xs text-muted">
                    {text.trim()
                      ? `${text.trim().split(/\s+/).length} words extracted`
                      : 'No text extracted'}
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Remove selected resume"
                  disabled={busy}
                  onClick={() => {
                    setFileName('Pasted resume');
                    setText('');
                    setResult(null);
                  }}
                  className="p-2 rounded-lg text-muted hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Resume editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="resume-text"
                  className="text-sm font-bold text-navy"
                >
                  Resume content
                </label>

                <span className="text-[11px] text-muted tabular-nums">
                  {text.length.toLocaleString()} characters
                </span>
              </div>

              <textarea
                id="resume-text"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setResult(null);
                  if (fileName !== 'Pasted resume') {
                    setFileName('Pasted resume');
                  }
                }}
                rows={10}
                maxLength={100000}
                placeholder="Paste your resume here — include your skills, experience, projects, and education for a more useful analysis."
                className="w-full min-h-56 rounded-xl border border-line bg-surface p-4 text-sm leading-6 text-navy placeholder:text-muted/80 outline-none resize-y focus:border-brand focus:ring-4 focus:ring-brand/10 transition-shadow"
              />

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  {text.trim()
                    ? `${text.trim().split(/\s+/).length} words`
                    : 'No resume content yet'}
                </span>

                <span>Minimum 40 characters</span>
              </div>
            </div>

            {/* Analyze action */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
              <div className="text-xs text-muted leading-relaxed">
                {result
                  ? 'Your latest results are shown below.'
                  : 'Ready when you are. Review your resume before analyzing.'}
              </div>

              <div className="w-full sm:w-auto sm:min-w-44">
                <Btn onClick={analyze} disabled={busy}>
                  {busy ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <LoaderCircle className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Analyze resume
                    </span>
                  )}
                </Btn>
              </div>
            </div>
          </div>
        </Card>

        {/* Previous analyses */}
        <Card className="overflow-hidden">
          <CardHead title="Previous analyses" />

          <div className="px-4 sm:px-5 pb-5 space-y-3">
            {d.resumes.length === 0 && (
              <div className="py-6">
                <Empty title="No analyses yet" />
                <p className="text-xs text-muted text-center mt-2">
                  Your saved analyses will appear here.
                </p>
              </div>
            )}

            {d.resumes.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 border border-line rounded-xl p-3 hover:border-brand/40 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-navy text-[13px] truncate">
                    {item.file_name}
                  </div>
                  <div className="text-[11px] text-muted mt-1">
                    {timeAgo(item.created_at)}
                  </div>
                </div>

                <Badge
                  tone={
                    item.ats_score >= 70
                      ? 'green'
                      : item.ats_score >= 45
                        ? 'amber'
                        : 'red'
                  }
                >
                  {item.ats_score}%
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Analysis results */}
      {(result || latest) &&
        (() => {
          const r: ResumeResult = result ?? {
            ats: latest!.ats_score,
            breakdown: latest!.breakdown,
            suggestions: latest!.suggestions,
            detected: d.skills.filter((s) =>
              latest!.detected_skill_ids.includes(s.id),
            ),
            missingDomain: d.skills.filter(
              (s) => !latest!.detected_skill_ids.includes(s.id),
            ),
            stats: {
              words: 0,
              metrics: 0,
              sections: [],
            },
          };

          const status = scoreStatus(r.ats);

          return (
            <section
              aria-label="Resume analysis results"
              className="space-y-5 lg:space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-brand" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-navy">
                    Analysis results
                  </h2>
                  <p className="text-xs text-muted">
                    Your resume's compatibility with this career path
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 lg:gap-6">
                {/* ATS score — contrast fixed here */}
                <Card className="relative overflow-hidden border border-line bg-white p-5 sm:p-7 flex flex-col items-center justify-center text-center">
                  <div className="absolute -top-16 -right-12 w-44 h-44 rounded-full bg-brand/10 blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-16 -left-12 w-40 h-40 rounded-full bg-sky-100/70 blur-3xl pointer-events-none" />

                  <div className="relative z-10 mb-5">
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted">
                      Resume health
                    </div>

                    <h3 className="text-lg font-extrabold text-navy mt-1">
                      ATS compatibility
                    </h3>
                  </div>

                  <div className="relative z-10 rounded-full bg-slate-50 p-2 border border-slate-100">
                    <Ring
                      value={r.ats}
                      size={150}
                      stroke={12}
                      label="ATS score"
                      tone="light"
                    />
                  </div>

                  <div
                    className={`relative z-10 inline-flex items-center gap-2 rounded-full border px-3.5 py-2 mt-5 text-xs font-bold ${status.background} ${status.color}`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${status.dot}`}
                    />
                    {status.label}
                  </div>

                  <p className="relative z-10 text-sm leading-relaxed text-slate-600 mt-4 max-w-xs">
                    {status.description}
                  </p>

                  <div className="relative z-10 w-full border-t border-slate-100 mt-5 pt-4">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-slate-500">
                        Detected skills
                      </span>
                      <span className="font-bold text-navy">
                        {r.detected.length}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-xs mt-2">
                      <span className="text-slate-500">
                        Skills not found
                      </span>
                      <span className="font-bold text-navy">
                        {r.missingDomain.length}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Score breakdown */}
                <Card className="xl:col-span-2 overflow-hidden">
                  <CardHead title="Score breakdown" />

                  <div className="px-4 sm:px-5 pb-5 space-y-5">
                    {Object.entries(r.breakdown).map(([key, value]) => (
                      <div key={key}>
                        <div className="flex items-center justify-between gap-3 text-[13px] mb-2">
                          <span className="font-semibold text-navy">
                            {key}
                          </span>

                          <span className="font-bold text-slate-600 tabular-nums">
                            {value}%
                          </span>
                        </div>

                        <Progress value={value} />
                      </div>
                    ))}

                    {Object.keys(r.breakdown).length === 0 && (
                      <p className="text-sm text-muted">
                        No score breakdown is available for this analysis.
                      </p>
                    )}
                  </div>
                </Card>

                {/* Detected skills */}
                <Card className="overflow-hidden">
                  <CardHead title="Skills detected" />

                  <div className="px-4 sm:px-5 pb-5">
                    {r.detected.length === 0 && (
                      <p className="text-sm text-muted">
                        No skills for this career path were found in your
                        resume.
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {r.detected.map((skill) => (
                        <Badge key={skill.id} tone="teal">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {skill.name}
                        </Badge>
                      ))}
                    </div>

                    {r.missingDomain.length > 0 && (
                      <>
                        <div className="text-[11px] font-bold text-muted uppercase tracking-wider mt-6 mb-3">
                          Not found in resume
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {r.missingDomain.map((skill) => (
                            <Badge key={skill.id}>{skill.name}</Badge>
                          ))}
                        </div>

                        <p className="text-[11px] text-muted mt-3 leading-relaxed">
                          Include these skills only if you genuinely have
                          the knowledge or experience.
                        </p>
                      </>
                    )}
                  </div>
                </Card>

                {/* Suggestions */}
                <Card className="xl:col-span-2 overflow-hidden">
                  <CardHead title="Suggestions to improve" />

                  <div className="px-4 sm:px-5 pb-5">
                    {r.suggestions.length === 0 && (
                      <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                        <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                          <CheckCircle2 className="w-4 h-4" />
                          No suggestions available
                        </div>
                        <p className="text-xs text-emerald-700 mt-1">
                          Keep your resume accurate and tailor it to each
                          job description.
                        </p>
                      </div>
                    )}

                    <div className="space-y-3">
                      {r.suggestions.map((suggestion, index) => (
                        <div
                          key={`${index}-${suggestion}`}
                          className="flex items-start gap-3 rounded-xl border border-line bg-canvas/40 p-3.5 sm:p-4"
                        >
                          <div className="w-8 h-8 shrink-0 rounded-lg bg-amber-50 flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                          </div>

                          <p className="text-[13px] text-navy leading-relaxed pt-1">
                            {suggestion}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>

              <p className="text-[11px] text-muted leading-relaxed">
                ATS score is an estimate based on the analyzer's configured
                criteria. Actual applicant tracking systems and recruiters
                may evaluate resumes differently.
              </p>
            </section>
          );
        })()}
    </div>
  );
}
