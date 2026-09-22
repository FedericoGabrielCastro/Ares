import type { JobStatus } from '../types/job';

const styles: Record<JobStatus, string> = {
  queued: 'bg-amber-50 text-amber-800 ring-amber-200',
  running: 'bg-sky-50 text-sky-800 ring-sky-200',
  completed: 'bg-teal-50 text-teal-800 ring-teal-200',
  failed: 'bg-rose-50 text-rose-800 ring-rose-200',
  cancelled: 'bg-stone-100 text-stone-600 ring-stone-200',
};

export function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide ring-1 ring-inset ${styles[status]}`}
    >
      {status}
    </span>
  );
}
