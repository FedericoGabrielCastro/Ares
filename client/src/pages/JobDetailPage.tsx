import { Link, useNavigate, useParams } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { useDeleteJob, useJob, useRetryJob } from '../hooks/useJobs';

export function JobDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const job = useJob(id);
  const retry = useRetryJob();
  const remove = useDeleteJob();

  if (job.isLoading) {
    return <p className="text-mute">Loading job…</p>;
  }

  if (job.isError || !job.data) {
    return (
      <div className="space-y-4">
        <p className="text-rose-700">Job not found.</p>
        <Link to="/jobs" className="text-accent hover:underline">
          Back to jobs
        </Link>
      </div>
    );
  }

  const data = job.data;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
        <div>
          <Link to="/jobs" className="text-sm text-mute hover:text-ink">
            ← Jobs
          </Link>
          <h1 className="mt-3 font-mono text-2xl text-ink sm:text-3xl">{data.id}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <StatusBadge status={data.status} />
            <span className="font-mono text-xs text-mute">{data.type}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(data.status === 'failed' || data.status === 'cancelled') && (
            <button type="button" onClick={() => retry.mutate(data.id)} className="ui-btn-accent">
              Retry
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              remove.mutate(data.id, {
                onSuccess: () => navigate('/jobs'),
              })
            }
            className="ui-btn-ghost"
          >
            {data.status === 'queued' || data.status === 'running' ? 'Cancel' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="grid border border-ink md:grid-cols-3">
        {[
          ['Created', new Date(data.createdAt).toLocaleString()],
          ['Updated', new Date(data.updatedAt).toLocaleString()],
          ['Attempts', String(data.attempts)],
        ].map(([label, value], index) => (
          <div
            key={label}
            className={`bg-panel px-4 py-4 ${index > 0 ? 'border-t border-ink md:border-t-0 md:border-l' : ''}`}
          >
            <p className="font-mono text-[11px] uppercase tracking-wide text-mute">{label}</p>
            <p className="mt-2 font-mono text-sm text-ink">{value}</p>
          </div>
        ))}
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="border border-ink bg-panel p-5">
          <h2 className="font-display text-lg font-bold text-ink">Input</h2>
          <pre className="mt-4 overflow-x-auto border border-white/10 bg-ink p-4 font-mono text-xs leading-relaxed text-orange-100">
            {JSON.stringify(data.input, null, 2)}
          </pre>
        </div>
        <div className="border border-ink bg-panel p-5">
          <h2 className="font-display text-lg font-bold text-ink">Result</h2>
          {data.error ? (
            <p className="mt-4 border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800">{data.error}</p>
          ) : data.result ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-mute">{data.result.summary}</p>
              <p className="font-mono text-xs text-mute">{data.result.durationMs} ms</p>
              <pre className="overflow-x-auto border border-white/10 bg-ink p-4 font-mono text-xs leading-relaxed text-orange-100">
                {JSON.stringify(data.result.data, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="mt-4 text-sm text-mute">Waiting for the worker to finish…</p>
          )}
        </div>
      </section>
    </div>
  );
}
