import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useJobs } from '../hooks/useJobs';
import { StatusBadge } from '../components/StatusBadge';
import type { JobStatus, JobType } from '../types/job';

export function JobsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<JobStatus | ''>('');
  const [type, setType] = useState<JobType | ''>('');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');

  const params = useMemo(
    () => ({
      page,
      limit: 10,
      status,
      type,
      q: search,
      sort: 'createdAt' as const,
      order: 'desc' as const,
    }),
    [page, status, type, search],
  );

  const jobs = useJobs(params);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-accent">Jobs</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Queue & history</h1>
        </div>
        <Link
          to="/jobs/new"
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:-translate-y-0.5"
        >
          New job
        </Link>
      </div>

      <form
        className="grid gap-3 rounded-2xl bg-white/80 p-4 ring-1 ring-line md:grid-cols-[1fr_auto_auto_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setSearch(q.trim());
        }}
      >
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search id, type, payload…"
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none ring-accent/30 focus:ring-2"
        />
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as JobStatus | '');
            setPage(1);
          }}
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="queued">Queued</option>
          <option value="running">Running</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={type}
          onChange={(event) => {
            setType(event.target.value as JobType | '');
            setPage(1);
          }}
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          <option value="text-stats">text-stats</option>
          <option value="hash">hash</option>
          <option value="transform">transform</option>
          <option value="delay">delay</option>
          <option value="csv-aggregate">csv-aggregate</option>
        </select>
        <button type="submit" className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white">
          Apply
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl bg-white/80 ring-1 ring-line">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-stone-50/80 text-xs uppercase tracking-wide text-mute">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Created</th>
              <th className="px-4 py-3 font-medium">Attempts</th>
            </tr>
          </thead>
          <tbody>
            {jobs.isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-mute">
                  Loading…
                </td>
              </tr>
            ) : jobs.data?.data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-mute">
                  No jobs match these filters.
                </td>
              </tr>
            ) : (
              jobs.data?.data.map((job) => (
                <tr key={job.id} className="border-b border-line/70 last:border-0 hover:bg-teal-50/40">
                  <td className="px-4 py-3">
                    <Link to={`/jobs/${job.id}`} className="font-mono text-ink hover:text-accent">
                      {job.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{job.type}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="hidden px-4 py-3 text-mute sm:table-cell">
                    {new Date(job.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono">{job.attempts}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-mute">
        <p>
          Page {jobs.data?.meta.page ?? page} of {jobs.data?.meta.totalPages ?? 1} · {jobs.data?.meta.total ?? 0}{' '}
          total
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="rounded-lg bg-white px-3 py-1.5 ring-1 ring-line disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={!jobs.data || page >= jobs.data.meta.totalPages}
            onClick={() => setPage((value) => value + 1)}
            className="rounded-lg bg-white px-3 py-1.5 ring-1 ring-line disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
