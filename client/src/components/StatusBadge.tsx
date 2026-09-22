import type { JobStatus } from '../types/job';

const styles: Record<JobStatus, string> = {
  queued: 'border-amber-500 text-amber-800 bg-amber-50',
  running: 'border-sky-500 text-sky-800 bg-sky-50',
  completed: 'border-emerald-600 text-emerald-800 bg-emerald-50',
  failed: 'border-rose-600 text-rose-800 bg-rose-50',
  cancelled: 'border-stone-400 text-stone-600 bg-stone-50',
};

export function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={`inline-flex items-center border-l-2 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide ${styles[status]}`}
    >
      {status}
    </span>
  );
}
