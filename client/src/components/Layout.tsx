import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useHealth } from '../hooks/useJobs';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block border-l-2 px-3 py-2 text-sm transition-colors ${
    isActive
      ? 'border-accent bg-ink text-white'
      : 'border-transparent text-mute hover:border-line hover:text-ink'
  }`;

export function Layout({ children }: { children: ReactNode }) {
  const health = useHealth();
  const online = health.data?.status === 'ok';

  return (
    <div className="relative min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(160deg,#eeeff2_0%,#e4e7ee_48%,#f7f7f9_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.45] [background-image:repeating-linear-gradient(-12deg,transparent_0_18px,rgba(18,20,26,0.03)_18px_19px)]" />

      <aside className="animate-rail border-b border-line bg-ink text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r lg:border-white/10">
        <div className="flex items-center justify-between gap-4 px-5 py-5 lg:block">
          <Link to="/" className="group block">
            <p className="font-display text-3xl font-extrabold tracking-tight transition group-hover:text-accent">
              Ares
            </p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.22em] text-white/45">
              Process desk
            </p>
          </Link>
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-white/55 lg:mt-6">
            <span className={`h-2 w-2 ${online ? 'bg-accent animate-blink' : 'bg-rose-400'}`} />
            {online ? 'Live' : 'Offline'}
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-4 lg:mt-2 lg:flex-1 lg:flex-col lg:overflow-visible lg:px-4">
          <NavLink to="/" end className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/jobs" className={linkClass}>
            Jobs
          </NavLink>
          <NavLink to="/jobs/new" className={linkClass}>
            New job
          </NavLink>
          <NavLink to="/api-explorer" className={linkClass}>
            API
          </NavLink>
        </nav>

        <div className="hidden border-t border-white/10 px-5 py-4 font-mono text-[11px] text-white/40 lg:block">
          Node · Express · React
        </div>
      </aside>

      <main className="min-w-0 px-5 py-8 sm:px-8 lg:py-10">
        <div className="mx-auto max-w-5xl animate-rise">{children}</div>
      </main>
    </div>
  );
}
