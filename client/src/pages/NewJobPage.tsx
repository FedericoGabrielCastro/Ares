import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateJob } from '../hooks/useJobs';
import type { JobType, TransformMode } from '../types/job';
import { ApiError } from '../api/client';

const typeHelp: Record<JobType, string> = {
  'text-stats': 'Stream the text and count words, lines, and characters.',
  hash: 'Hash the payload in a worker thread with SHA-256.',
  transform: 'Apply upper, lower, or reverse transforms.',
  delay: 'Simulate a long-running job with an artificial wait.',
  'csv-aggregate': 'Parse CSV text and aggregate a numeric column.',
};

export function NewJobPage() {
  const navigate = useNavigate();
  const createJob = useCreateJob();
  const [type, setType] = useState<JobType>('text-stats');
  const [text, setText] = useState('Ares processes jobs with Node streams and workers.');
  const [mode, setMode] = useState<TransformMode>('upper');
  const [delayMs, setDelayMs] = useState(1500);
  const [csv, setCsv] = useState('name,value\nalpha,10\nbeta,25\ngamma,5');
  const [column, setColumn] = useState('value');
  const [error, setError] = useState<string | null>(null);

  const payload = useMemo(() => {
    switch (type) {
      case 'text-stats':
      case 'hash':
        return { type, input: { text } };
      case 'transform':
        return { type, input: { text, mode } };
      case 'delay':
        return { type, input: { delayMs } };
      case 'csv-aggregate':
        return { type, input: { csv, column } };
      default:
        return { type, input: {} };
    }
  }, [type, text, mode, delayMs, csv, column]);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="border-b border-line pb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-accent">Create</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-ink">New job</h1>
        <p className="mt-3 text-mute">{typeHelp[type]}</p>
      </div>

      <form
        className="space-y-5 border border-ink bg-panel p-5"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          createJob.mutate(payload, {
            onSuccess: (job) => navigate(`/jobs/${job.id}`),
            onError: (err) => {
              setError(err instanceof ApiError ? err.message : 'Failed to create job');
            },
          });
        }}
      >
        <label className="block space-y-2">
          <span className="text-sm font-medium text-ink">Job type</span>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as JobType)}
            className="ui-field"
          >
            <option value="text-stats">text-stats</option>
            <option value="hash">hash</option>
            <option value="transform">transform</option>
            <option value="delay">delay</option>
            <option value="csv-aggregate">csv-aggregate</option>
          </select>
        </label>

        {(type === 'text-stats' || type === 'hash' || type === 'transform') && (
          <label className="block space-y-2">
            <span className="text-sm font-medium text-ink">Text</span>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={6}
              className="ui-field font-mono"
            />
          </label>
        )}

        {type === 'transform' && (
          <label className="block space-y-2">
            <span className="text-sm font-medium text-ink">Mode</span>
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value as TransformMode)}
              className="ui-field"
            >
              <option value="upper">upper</option>
              <option value="lower">lower</option>
              <option value="reverse">reverse</option>
            </select>
          </label>
        )}

        {type === 'delay' && (
          <label className="block space-y-2">
            <span className="text-sm font-medium text-ink">Delay (ms)</span>
            <input
              type="number"
              min={0}
              max={30000}
              value={delayMs}
              onChange={(event) => setDelayMs(Number(event.target.value))}
              className="ui-field font-mono"
            />
          </label>
        )}

        {type === 'csv-aggregate' && (
          <>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink">CSV</span>
              <textarea
                value={csv}
                onChange={(event) => setCsv(event.target.value)}
                rows={7}
                className="ui-field font-mono"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink">Column</span>
              <input
                value={column}
                onChange={(event) => setColumn(event.target.value)}
                className="ui-field font-mono"
              />
            </label>
          </>
        )}

        {error && <p className="border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}

        <button type="submit" disabled={createJob.isPending} className="ui-btn disabled:opacity-60">
          {createJob.isPending ? 'Submitting…' : 'Enqueue job'}
        </button>
      </form>
    </div>
  );
}
