import { useState } from 'react';
import { Link, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Logo, Btn, Field, inputCls } from '../components/ui';
import { useAuth } from '../store/AuthContext';

export function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const { session, signIn, signUp } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [f, setF] = useState({ name: '', email: '', password: '', college: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');

  if (session) return <Navigate to={params.get('redirect') || '/dashboard'} replace />;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setInfo(''); setBusy(true);
    try {
      if (mode === 'login') { await signIn(f.email.trim(), f.password); nav(params.get('redirect') || '/dashboard'); }
      else {
        if (f.password.length < 6) throw new Error('Password must be at least 6 characters.');
        const { needsConfirm } = await signUp(f.email.trim(), f.password, f.name.trim(), f.college.trim());
        if (needsConfirm) setInfo('Account created. Check your email to confirm, then log in.');
        else nav('/domains');
      }
    } catch (e) { setErr(e instanceof Error ? e.message : 'Something went wrong'); }
    setBusy(false);
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-navy to-[#1B2F63] text-white p-12">
        <Logo />
        <div>
          <h2 className="text-4xl font-extrabold leading-tight mb-6">Your readiness,<br />calculated from real results.</h2>
          {['Skill scores from quizzes and coding tests', 'Gaps and roadmap that update as you improve', 'Resume, interview and job matching in one place'].map((t) => (
            <div key={t} className="flex items-center gap-3 mb-3 text-slate-200 text-sm"><span className="w-5 h-5 rounded-full bg-teal flex items-center justify-center"><Check className="w-3 h-3" /></span>{t}</div>
          ))}
        </div>
        <div className="text-xs text-slate-400">© SkillTwin Live</div>
      </div>
      <div className="flex items-center justify-center p-6 bg-canvas">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4">
          <div className="lg:hidden mb-4"><Logo dark={false} /></div>
          <div>
            <h1 className="text-2xl font-extrabold text-navy">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
            <p className="text-sm text-muted mt-1">{mode === 'login' ? 'Log in to continue your journey.' : 'Start building your skill twin in minutes.'}</p>
          </div>
          {mode === 'signup' && (<>
            <Field label="Full name"><input required className={inputCls} value={f.name} onChange={set('name')} placeholder="Your name" /></Field>
            <Field label="College / University (optional)"><input className={inputCls} value={f.college} onChange={set('college')} /></Field>
          </>)}
          <Field label="Email"><input required type="email" className={inputCls} value={f.email} onChange={set('email')} placeholder="you@example.com" /></Field>
          <Field label="Password"><input required type="password" className={inputCls} value={f.password} onChange={set('password')} placeholder="••••••••" /></Field>
          {err && <div className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{err}</div>}
          {info && <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">{info}</div>}
          <Btn type="submit" disabled={busy} className="w-full">{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}</Btn>
          <p className="text-center text-sm text-muted">
            {mode === 'login' ? <>New here? <Link className="text-brand font-bold" to="/signup">Create an account</Link></> : <>Already registered? <Link className="text-brand font-bold" to="/login">Log in</Link></>}
          </p>
        </form>
      </div>
    </div>
  );
}
