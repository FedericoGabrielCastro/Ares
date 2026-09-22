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

  const cards = [
    { label: 'Queued', value: stats.data?.queued ?? '—', hint: 'Waiting in queue' },
    { label: 'Running', value: stats.data?.running ?? '—', hint: 'Active workers' },
    { label: 'Completed', value: stats.data?.completed ?? '—', hint: 'Successful runs' },
    { label: 'Failed', value: stats.data?.failed ?? '—', hint: 'Needs retry' },
  ];

  return (
    <div className="space-y-10">
      <section className="max-w-2xl">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-accent">Overview</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Watch work move through the queue.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-mute">
          Submit text, hash, transform, delay, or CSV jobs to the Express API and inspect live results with TanStack
          Query plus Server-Sent Events.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/jobs/new"
            className="rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-ink/90"
          >
            Create job
          </Link>
          <Link
            to="/api-explorer"
            className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-ink ring-1 ring-line transition hover:-translate-y-0.5"
          >
            Open API explorer
          </Link>
          <button
            type="button"
            onClick={() => seed.mutate()}
            disabled={seed.isPending}
            className="rounded-lg bg-accent/10 px-4 py-2.5 text-sm font-medium text-accent ring-1 ring-accent/20 transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            {seed.isPending ? 'Seeding…' : 'Load sample jobs'}
          </button>
        </div>
        {seed.isSuccess && <p className="mt-3 text-sm text-mute">{seed.data.message}</p>}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <div
            key={card.label}
            className="animate-fade-up rounded-2xl bg-white/80 p-5 ring-1 ring-line"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <p className="text-xs uppercase tracking-wide text-mute">{card.label}</p>
            <p className="mt-3 font-mono text-3xl text-ink">{card.value}</p>
            <p className="mt-2 text-sm text-mute">{card.hint}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl bg-white/80 p-5 ring-1 ring-line">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">Recent jobs</h2>
            <Link to="/jobs" className="text-sm text-accent hover:underline">
              View all
            </Link>
          </div>
          {jobs.isLoading ? (
            <p className="text-sm text-mute">Loading jobs…</p>
          ) : jobs.data?.data.length === 0 ? (
            <p className="text-sm text-mute">No jobs yet. Create one or load samples to see the queue in action.</p>
          ) : (
            <ul className="divide-y divide-line">
              {jobs.data?.data.map((job) => (
                <li key={job.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <Link to={`/jobs/${job.id}`} className="font-mono text-sm text-ink hover:text-accent">
                      {job.id}
                    </Link>
                    <p className="truncate text-xs text-mute">{job.type}</p>
                  </div>
                  <StatusBadge status={job.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl bg-ink p-5 text-white shadow-xl shadow-ink/10">
          <h2 className="font-display text-lg font-semibold">Runtime</h2>
          <dl className="mt-5 space-y-4 font-mono text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-white/55">Concurrency</dt>
              <dd>{stats.data?.concurrency ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-white/55">Queue depth</dt>
              <dd>{stats.data?.queueDepth ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-white/55">Avg duration</dt>
              <dd>{stats.data ? `${stats.data.averageDurationMs} ms` : '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-white/55">Processed / min</dt>
              <dd>{stats.data?.processedLastMinute ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-white/55">Heap</dt>
              <dd>{stats.data ? formatBytes(stats.data.memory.heapUsed) : '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-white/55">Node</dt>
              <dd>{stats.data?.node ?? '—'}</dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}
