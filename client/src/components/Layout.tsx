import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useHealth } from '../hooks/useJobs';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm transition-colors ${isActive ? 'text-ink' : 'text-mute hover:text-ink'}`;

export function Layout({ children }: { children: ReactNode }) {
  const health = useHealth();

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_#d7ebe6_0%,_transparent_55%),linear-gradient(180deg,#f4f7f6_0%,#eef2f1_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35] [background-image:linear-gradient(rgba(15,23,22,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,22,0.04)_1px,transparent_1px)] [background-size:48px_48px]" />

      <header className="border-b border-line/70 bg-white/55 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4">
          <Link to="/" className="group flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-white shadow-sm shadow-accent/25 transition-transform duration-300 group-hover:-translate-y-0.5">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 18 L12 5 L19 18 Z" strokeLinejoin="round" />
                <path d="M8 13 H16" strokeLinecap="round" />
              </svg>
            </span>
            <div>
              <p className="font-display text-lg font-semibold tracking-tight text-ink">Ares</p>
              <p className="text-xs text-mute">Job processing platform</p>
            </div>
          </Link>

          <nav className="flex items-center gap-5">
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
            <span className="hidden items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs text-mute ring-1 ring-line sm:inline-flex">
              <span
                className={`h-1.5 w-1.5 rounded-full ${health.data?.status === 'ok' ? 'bg-accent animate-pulse-soft' : 'bg-rose-400'}`}
              />
              API {health.data?.status === 'ok' ? 'online' : 'checking'}
            </span>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 animate-fade-up">{children}</main>
    </div>
  );
}
