import { Link } from 'react-router-dom';
import { useJobs, useSeedJobs, useStats } from '../hooks/useJobs';
import { StatusBadge } from '../components/StatusBadge';

function formatBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DashboardPage() {
  const stats = useStats();
  const jobs = useJobs({ page: 1, limit: 6, sort: 'createdAt', order: 'desc' });
  const seed = useSeedJobs();

  const meters = [
    { label: 'Queued', value: stats.data?.queued ?? '—' },
    { label: 'Running', value: stats.data?.running ?? '—' },
    { label: 'Done', value: stats.data?.completed ?? '—' },
    { label: 'Failed', value: stats.data?.failed ?? '—' },
  ];

  return (
    <div className="space-y-12">
      <section className="border-b border-line pb-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-accent">Ares</p>
        <h1 className="mt-4 max-w-3xl font-display text-5xl font-extrabold leading-[0.95] tracking-tight text-ink sm:text-6xl">
          Jobs in motion.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-mute">
          Enqueue work, watch workers chew through it, and inspect results — powered by Express
          streams, worker threads, and TanStack Query.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link to="/jobs/new" className="ui-btn">
            Create job
          </Link>
          <Link to="/api-explorer" className="ui-btn-ghost">
            API explorer
          </Link>
          <button
            type="button"
            onClick={() => seed.mutate()}
            disabled={seed.isPending}
            className="ui-btn-accent disabled:opacity-50"
          >
            {seed.isPending ? 'Seeding…' : 'Load samples'}
          </button>
        </div>
        {seed.isSuccess && <p className="mt-3 text-sm text-mute">{seed.data.message}</p>}
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-4">
          <h2 className="font-display text-xl font-bold text-ink">Queue meter</h2>
          <p className="font-mono text-[11px] uppercase tracking-wide text-mute">live</p>
        </div>
        <div className="grid border border-ink sm:grid-cols-4">
          {meters.map((meter, index) => (
            <div
              key={meter.label}
              className={`animate-rise bg-panel px-4 py-5 ${index > 0 ? 'border-t border-ink sm:border-t-0 sm:border-l' : ''}`}
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-mute">{meter.label}</p>
              <p className="mt-3 font-display text-4xl font-bold text-ink">{meter.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-[1.35fr_0.9fr]">
        <div>
          <div className="mb-4 flex items-end justify-between gap-4 border-b border-line pb-3">
            <h2 className="font-display text-xl font-bold text-ink">Recent</h2>
            <Link to="/jobs" className="text-sm text-accent hover:underline">
              All jobs
            </Link>
          </div>
          {jobs.isLoading ? (
            <p className="text-sm text-mute">Loading jobs…</p>
          ) : jobs.data?.data.length === 0 ? (
            <p className="text-sm text-mute">No jobs yet. Load samples to fill the desk.</p>
          ) : (
            <ul>
              {jobs.data?.data.map((job) => (
                <li
                  key={job.id}
                  className="flex items-center justify-between gap-4 border-b border-line py-3 transition hover:bg-white/60"
                >
                  <div className="min-w-0">
                    <Link to={`/jobs/${job.id}`} className="font-mono text-sm text-ink hover:text-accent">
                      {job.id}
                    </Link>
                    <p className="truncate font-mono text-[11px] text-mute">{job.type}</p>
                  </div>
                  <StatusBadge status={job.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border border-ink bg-ink px-5 py-5 text-white">
          <h2 className="font-display text-xl font-bold">Runtime</h2>
          <dl className="mt-6 space-y-4 font-mono text-sm">
            {[
              ['Concurrency', stats.data?.concurrency ?? '—'],
              ['Queue depth', stats.data?.queueDepth ?? '—'],
              ['Avg duration', stats.data ? `${stats.data.averageDurationMs} ms` : '—'],
              ['Processed / min', stats.data?.processedLastMinute ?? '—'],
              ['Heap', stats.data ? formatBytes(stats.data.memory.heapUsed) : '—'],
              ['Node', stats.data?.node ?? '—'],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex justify-between gap-4 border-b border-white/10 pb-3 last:border-0">
                <dt className="text-white/45">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}
