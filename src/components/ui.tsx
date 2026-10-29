import { Link } from 'react-router-dom';
import type { ReactNode, ButtonHTMLAttributes } from 'react';
import { X } from 'lucide-react';

export function Logo({ dark = true, to }: { dark?: boolean; to?: string }) {
  const inner = (
    <div className="flex items-center gap-2.5 select-none">
      <div className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center text-white text-lg font-extrabold shadow-sm"
        style={{ background: 'linear-gradient(135deg,#5B2EFF,#00A88F)' }}>✦</div>
      <span className={`text-[19px] font-bold tracking-tight ${dark ? 'text-white' : 'text-navy'}`}>
        Skill<span className="text-[#AFA0FF]">Twin</span> Live
      </span>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`bg-white border border-line rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,.04)] ${className}`}>{children}</div>
);

export const CardHead = ({ title, right, sub }: { title: string; right?: ReactNode; sub?: string }) => (
  <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
    <div>
      <h3 className="text-[15px] font-bold text-navy">{title}</h3>
      {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
    </div>
    {right}
  </div>
);

export const PageHeader = ({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
    <div>
      <h1 className="text-2xl sm:text-[27px] font-extrabold text-navy tracking-tight">{title}</h1>
      {sub && <p className="text-[13px] text-muted mt-1 max-w-2xl">{sub}</p>}
    </div>
    {right}
  </div>
);

export function Btn({ variant = 'primary', className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'teal' }) {
  const v = {
    primary: 'bg-brand text-white hover:bg-brand-dark hover:shadow-lg hover:shadow-brand/20',
    teal: 'bg-teal text-white hover:opacity-90',
    ghost: 'bg-white text-navy border border-line hover:border-brand hover:text-brand',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }[variant];
  return <button {...p} className={`inline-flex items-center justify-center gap-2 rounded-[9px] px-4 py-2.5 text-[13px] font-bold transition disabled:opacity-50 ${v} ${className}`} />;
}
export function LinkBtn({ to, children, variant = 'primary', className = '' }: { to: string; children: ReactNode; variant?: 'primary' | 'ghost'; className?: string }) {
  const v = variant === 'primary' ? 'bg-brand text-white hover:bg-brand-dark' : 'bg-white text-navy border border-line hover:border-brand hover:text-brand';
  return <Link to={to} className={`inline-flex items-center justify-center gap-2 rounded-[9px] px-4 py-2.5 text-[13px] font-bold transition ${v} ${className}`}>{children}</Link>;
}

export const Badge = ({ children, tone = 'slate' }: { children: ReactNode; tone?: 'slate' | 'green' | 'red' | 'amber' | 'purple' | 'teal' }) => {
  const t = {
    slate: 'bg-slate-100 text-slate-600', green: 'bg-emerald-50 text-emerald-700', red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-700', purple: 'bg-brand-soft text-brand', teal: 'bg-teal-soft text-teal',
  }[tone];
  return <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md ${t}`}>{children}</span>;
};

export const scoreColor = (s: number) => (s >= 70 ? '#00A88F' : s >= 45 ? '#5B2EFF' : s > 0 ? '#F59E0B' : '#CBD5E1');

export const Progress = ({ value, color, h = 'h-2' }: { value: number; color?: string; h?: string }) => (
  <div className={`w-full ${h} bg-slate-100 rounded-full overflow-hidden`}>
    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color || scoreColor(value) }} />
  </div>
);

export const StatCard = ({ label, value, sub, icon, tone = 'brand' }: { label: string; value: ReactNode; sub?: string; icon: ReactNode; tone?: 'brand' | 'teal' | 'amber' | 'navy' }) => {
  const bg = { brand: 'bg-brand-soft text-brand', teal: 'bg-teal-soft text-teal', amber: 'bg-amber-50 text-amber-600', navy: 'bg-slate-100 text-navy' }[tone];
  return (
    <Card className="p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${bg}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</div>
        <div className="text-2xl font-extrabold text-navy leading-tight">{value}</div>
        {sub && <div className="text-[11px] text-muted truncate">{sub}</div>}
      </div>
    </Card>
  );
};

export function Ring({
  value,
  size = 120,
  stroke = 12,
  label,
  tone = 'dark',
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  tone?: 'dark' | 'light';
}) {
  const safeValue = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${safeValue}% ${label ?? 'score'}`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={tone === 'light' ? '#E2E8F0' : 'rgba(148,163,184,.3)'}
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#00D4B1"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - safeValue / 100)}
          style={{ transition: 'stroke-dashoffset .8s ease' }}
        />
      </svg>

      <div
        className={`absolute inset-0 flex flex-col items-center justify-center ${
          tone === 'light' ? 'text-navy' : 'text-white'
        }`}
      >
        <span className="text-3xl font-extrabold leading-none tabular-nums">
          {safeValue}%
        </span>

        {label && (
          <span
            className={`mt-2 text-[10px] font-bold uppercase tracking-wider ${
              tone === 'light' ? 'text-slate-600' : 'text-slate-200'
            }`}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

export const Spinner = ({ label = 'Loading…' }: { label?: string }) => (
  <div className="flex items-center justify-center gap-3 py-20 text-muted text-sm">
    <div className="w-5 h-5 border-2 border-line border-t-brand rounded-full animate-spin" /> {label}
  </div>
);

export const Empty = ({ title, text, action }: { title: string; text?: string; action?: ReactNode }) => (
  <div className="text-center py-12 px-4">
    <div className="text-3xl mb-2">🌱</div>
    <div className="font-bold text-navy">{title}</div>
    {text && <p className="text-xs text-muted mt-1 max-w-sm mx-auto">{text}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="fade-up bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h3 className="font-bold text-navy">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-navy"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block">
    <span className="block text-xs font-bold text-navy mb-1.5">{label}</span>
    {children}
  </label>
);
export const inputCls = 'w-full rounded-[9px] border border-line bg-white px-3.5 py-2.5 text-sm text-navy outline-none focus:border-brand focus:ring-2 focus:ring-brand/15';

export const timeAgo = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};
