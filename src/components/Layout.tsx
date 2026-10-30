import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Layers, FileText, ClipboardCheck, Target, Compass, Library, FolderKanban, Mic, Briefcase,
  PieChart, Settings, LogOut, Menu, X, User, ChevronDown,
} from 'lucide-react';
import { Logo, Spinner } from './ui';
import { useAuth } from '../store/AuthContext';
import { useData } from '../store/DataContext';

const groups = [
  { title: 'MAIN', items: [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Career Domain', to: '/domains', icon: Layers },
    { label: 'Resume Analyzer', to: '/resume', icon: FileText },
    { label: 'Assessments', to: '/assessments', icon: ClipboardCheck },
    { label: 'Skill Gap', to: '/skill-gap', icon: Target },
    { label: 'Career Path', to: '/career-path', icon: Compass },
  ] },
  { title: 'LEARN', items: [
    { label: 'Learning Resources', to: '/learning', icon: Library },
    { label: 'Projects', to: '/projects', icon: FolderKanban },
  ] },
  { title: 'CAREER', items: [
    { label: 'Mock Interview', to: '/interview', icon: Mic },
    { label: 'Job Matches', to: '/jobs', icon: Briefcase },
  ] },
  { title: 'INSIGHTS', items: [{ label: 'Analytics', to: '/analytics', icon: PieChart }] },
  { title: 'SYSTEM', items: [
    { label: 'Profile', to: '/profile', icon: User },
    { label: 'Settings', to: '/settings', icon: Settings },
  ] },
];

export function Layout() {
  const { session, profile, loading, signOut } = useAuth();
  const { domain, loading: dataLoading } = useData();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => { setMenu(false); }, [loc.pathname]);
  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent | TouchEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(false); };
    document.addEventListener('mousedown', onDown); document.addEventListener('touchstart', onDown); document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('touchstart', onDown); document.removeEventListener('keydown', onKey); };
  }, [menu]);

  if (loading) return <Spinner />;
  if (!session) return <Navigate to={`/login?redirect=${encodeURIComponent(loc.pathname)}`} replace />;
  // first-time users must choose a career domain before anything else makes sense
  if (profile && !profile.domain_id && loc.pathname !== '/domains') return <Navigate to="/domains" replace />;

  const name = profile?.full_name || 'Student';
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex bg-canvas">
      {open && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed lg:sticky top-0 h-screen z-50 w-[250px] shrink-0 bg-navy text-white flex flex-col border-r border-[#172F50] transition-transform ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex-1 overflow-y-auto scroll-thin py-5 px-3.5">
          <div className="px-2.5 pb-6 border-b border-white/10 flex items-center justify-between">
            <Logo to="/dashboard" />
            <button className="lg:hidden text-slate-400" onClick={() => setOpen(false)}><X className="w-5 h-5" /></button>
          </div>
          <div className="mt-5 space-y-5">
            {groups.map((g) => (
              <div key={g.title}>
                <div className="px-3 mb-2 text-[10px] font-bold text-[#8EA1BC] tracking-[1.2px]">{g.title}</div>
                <div className="space-y-1">
                  {g.items.map((it) => (
                    <NavLink key={it.to} to={it.to} onClick={() => setOpen(false)}
                      className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-[9px] text-[13.5px] font-medium transition ${isActive ? 'bg-brand text-white font-semibold shadow-[0_7px_18px_rgba(91,46,255,.25)]' : 'text-[#C5D0DF] hover:text-white hover:bg-white/10'}`}>
                      <it.icon className="w-[18px] h-[18px]" /> <span className="truncate">{it.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-white border-b border-line px-4 sm:px-7 h-14 flex items-center gap-3">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="w-6 h-6 text-navy" /></button>
          <div className="lg:hidden"><Logo dark={false} /></div>
          <div className="hidden lg:block text-xs text-muted truncate">{domain ? <>Career path: <b className="text-navy">{domain.icon} {domain.name}</b></> : 'Choose a career path'}</div>

          <div className="ml-auto relative" ref={menuRef}>
            <button onClick={() => setMenu((v) => !v)} aria-haspopup="menu" aria-expanded={menu}
              className="flex items-center gap-2.5 rounded-xl pl-1.5 pr-2.5 py-1.5 hover:bg-slate-100 transition">
              <div className="w-8 h-8 rounded-full bg-brand text-white font-bold text-xs flex items-center justify-center">{initials}</div>
              <div className="hidden sm:block text-left min-w-0 max-w-[170px]">
                <div className="text-xs font-bold text-navy truncate">{name}</div>
                <div className="text-[10px] text-muted truncate">{domain?.role_title ?? 'Choose a path'}</div>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted transition ${menu ? 'rotate-180' : ''}`} />
            </button>
            {menu && (
              <div role="menu" className="absolute right-0 top-full mt-2 w-60 bg-white border border-line rounded-xl shadow-xl overflow-hidden fade-up">
                <div className="px-4 py-3 border-b border-line">
                  <div className="text-sm font-bold text-navy truncate">{name}</div>
                  <div className="text-[11px] text-muted truncate">{profile?.email ?? session.user.email}</div>
                </div>
                <div className="p-1.5">
                  <NavLink role="menuitem" to="/profile" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-navy hover:bg-slate-100"><User className="w-4 h-4" /> Profile</NavLink>
                  <NavLink role="menuitem" to="/domains" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-navy hover:bg-slate-100"><Layers className="w-4 h-4" /> Change career path</NavLink>
                  <NavLink role="menuitem" to="/settings" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-navy hover:bg-slate-100"><Settings className="w-4 h-4" /> Settings</NavLink>
                </div>
                <div className="p-1.5 border-t border-line">
                  <button role="menuitem" onClick={async () => { setMenu(false); await signOut(); nav('/login'); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-red-600 hover:bg-red-50"><LogOut className="w-4 h-4" /> Sign out</button>
                </div>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-7 max-w-[1500px] w-full mx-auto">
          {dataLoading && profile?.domain_id ? <Spinner label="Loading your skill twin…" /> : <div className="fade-up"><Outlet /></div>}
        </main>
      </div>
    </div>
  );
}