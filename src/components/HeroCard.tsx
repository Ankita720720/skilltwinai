import type { ReactNode } from 'react';
import { Ring } from './ui';

/** The dark gradient "hero" panel used on the Dashboard, reused on other pages. */
export function HeroCard({ eyebrow, title, children, actions, ring, ringLabel = 'Ready', stats }: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  ring?: number;
  ringLabel?: string;
  stats?: { label: string; value: ReactNode }[];
}) {
  return (
    <div className="bg-gradient-to-r from-navy via-[#12284C] to-[#162F52] text-white rounded-[17px] p-6 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
      <div className="max-w-2xl w-full">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#B8AAFF] mb-2">{eyebrow}</div>
        <h2 className="text-xl sm:text-2xl font-bold mb-2">{title}</h2>
        {children && <p className="text-xs text-slate-300 leading-relaxed">{children}</p>}
        {stats && stats.length > 0 && (
          <div className="flex flex-wrap gap-2.5 mt-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-white/10 rounded-[10px] px-3.5 py-2 min-w-[84px]">
                <div className="text-lg font-extrabold leading-tight tabular-nums">{s.value}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-300">{s.label}</div>
              </div>
            ))}
          </div>
        )}
        {actions && <div className="flex flex-wrap gap-2 mt-4">{actions}</div>}
      </div>
      {ring !== undefined && <Ring value={ring} size={132} label={ringLabel} />}
    </div>
  );
}

export const heroPrimary = 'bg-brand hover:bg-brand-dark text-xs font-bold px-4 py-2.5 rounded-[9px] inline-flex items-center gap-1.5';
export const heroGhost = 'bg-white/10 hover:bg-white/20 text-xs font-bold px-4 py-2.5 rounded-[9px] inline-flex items-center gap-1.5';
