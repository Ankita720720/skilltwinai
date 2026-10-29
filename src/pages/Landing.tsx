import { Link } from 'react-router-dom';
import { Target, FileText, Mic, Compass, ClipboardCheck, Briefcase } from 'lucide-react';
import { Logo } from '../components/ui';
import { useAuth } from '../store/AuthContext';

const features = [
  { icon: ClipboardCheck, title: 'Verified skill scores', text: 'Quizzes and coding tests build a live score for every skill — not a self-rating.' },
  { icon: Target, title: 'Live skill-gap analysis', text: 'Gaps are recalculated from your results and ranked by how much they matter for the role.' },
  { icon: FileText, title: 'Resume intelligence', text: 'Upload your resume to detect skills and get an ATS-style score with concrete fixes.' },
  { icon: Compass, title: 'Adaptive roadmap', text: 'Your path updates as your scores change, with resources matched to your weakest areas.' },
  { icon: Mic, title: 'Mock interviews', text: 'Answer real questions and get scored on concept coverage and clarity.' },
  { icon: Briefcase, title: 'Job matching', text: 'Matches are computed from your verified skills against each role’s requirements.' },
];

export function Landing() {
  const { session } = useAuth();
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-navy">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 h-16">
          <Logo />
          <div className="flex items-center gap-2">
            {session ? (
              <Link to="/dashboard" className="bg-brand text-white text-sm font-bold px-4 py-2 rounded-[9px]">Open dashboard</Link>
            ) : (<>
              <Link to="/login" className="text-slate-200 text-sm font-semibold px-3 py-2 hover:text-white">Log in</Link>
              <Link to="/signup" className="bg-brand text-white text-sm font-bold px-4 py-2 rounded-[9px] hover:bg-brand-dark">Get started</Link>
            </>)}
          </div>
        </div>
      </header>
      <section className="bg-gradient-to-br from-navy via-[#12284C] to-[#1B2F63] text-white">
        <div className="max-w-6xl mx-auto px-5 py-20 sm:py-28 text-center">
          <div className="inline-block text-[11px] font-bold tracking-widest uppercase text-[#B8AAFF] bg-white/10 rounded-full px-3 py-1 mb-5">✦ Your skills, measured — not guessed</div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl mx-auto leading-[1.05]">A career companion that <span className="text-[#7CF0DB]">learns from what you do</span></h1>
          <p className="text-slate-300 mt-5 max-w-2xl mx-auto">Take assessments, practise interviews and build projects. SkillTwin Live turns every action into a personal readiness score, gap analysis and roadmap.</p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/signup" className="bg-brand hover:bg-brand-dark text-white font-bold px-6 py-3 rounded-[10px]">Create your skill twin</Link>
            <Link to="/login" className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-[10px]">Log in</Link>
          </div>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-5 py-16">
        <h2 className="text-2xl font-extrabold text-navy text-center mb-10">Everything updates from your own data</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="border border-line rounded-2xl p-6 hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center mb-4"><f.icon className="w-5 h-5" /></div>
              <h3 className="font-bold text-navy mb-1">{f.title}</h3>
              <p className="text-sm text-muted">{f.text}</p>
            </div>
          ))}
        </div>
      </section>
      <footer className="border-t border-line text-center text-xs text-muted py-6">© {new Date().getFullYear()} SkillTwin Live</footer>
    </div>
  );
}
