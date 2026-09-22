import { useMemo, useState } from 'react';
import { ApiError } from '../api/client';

type HttpMethod = 'GET' | 'POST' | 'DELETE';

interface EndpointExample {
  id: string;
  label: string;
  method: HttpMethod;
  path: string;
  body?: string;
}

const examples: EndpointExample[] = [
  { id: 'health', label: 'Health', method: 'GET', path: '/api/health' },
  { id: 'stats', label: 'Stats', method: 'GET', path: '/api/stats' },
  { id: 'jobs', label: 'List jobs', method: 'GET', path: '/api/jobs?limit=5' },
  {
    id: 'create',
    label: 'Create transform job',
    method: 'POST',
    path: '/api/jobs',
    body: JSON.stringify(
      { type: 'transform', input: { text: 'ares explorer', mode: 'upper' } },
      null,
      2,
    ),
  },
  {
    id: 'bulk',
    label: 'Bulk create',
    method: 'POST',
    path: '/api/jobs/bulk',
    body: JSON.stringify(
      {
        jobs: [
          { type: 'hash', input: { text: 'one' } },
          { type: 'delay', input: { delayMs: 400 } },
        ],
      },
      null,
      2,
    ),
  },
  {
    id: 'seed',
    label: 'Seed samples',
    method: 'POST',
    path: '/api/jobs/seed',
  },
];

export function ApiExplorerPage() {
  const [selectedId, setSelectedId] = useState(examples[0]!.id);
  const selected = useMemo(
    () => examples.find((item) => item.id === selectedId) ?? examples[0]!,
    [selectedId],
  );
  const [path, setPath] = useState(selected.path);
  const [method, setMethod] = useState<HttpMethod>(selected.method);
  const [body, setBody] = useState(selected.body ?? '');
  const [response, setResponse] = useState<string>('Send a request to see the response.');
  const [status, setStatus] = useState<string>('idle');
  const [pending, setPending] = useState(false);

  return (
    <div className="space-y-8">
      <div className="border-b border-line pb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-accent">API</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-ink">Explorer</h1>
        <p className="mt-3 max-w-2xl text-mute">
          Hit the Express routes directly from the UI. Useful for demos and for verifying request validation without
          leaving the browser.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-1 border border-ink bg-panel p-2">
          {examples.map((example) => (
            <button
              key={example.id}
              type="button"
              onClick={() => {
                setSelectedId(example.id);
                setPath(example.path);
                setMethod(example.method);
                setBody(example.body ?? '');
                setStatus('idle');
                setResponse('Send a request to see the response.');
              }}
              className={`block w-full border-l-2 px-3 py-2 text-left text-sm transition ${
                selectedId === example.id
                  ? 'border-accent bg-ink text-white'
                  : 'border-transparent text-ink hover:bg-paper'
              }`}
            >
              <span className="font-mono text-[10px] uppercase opacity-70">{example.method}</span>
              <span className="mt-0.5 block">{example.label}</span>
            </button>
          ))}
        </aside>

        <form
          className="space-y-4 border border-ink bg-panel p-5"
          onSubmit={(event) => {
            event.preventDefault();
            setPending(true);
            void (async () => {
              try {
                const init: RequestInit = { method };
                if (method !== 'GET' && method !== 'DELETE' && body.trim()) {
                  init.headers = { 'Content-Type': 'application/json' };
                  init.body = body;
                }
                const res = await fetch(path, init);
                const text = await res.text();
                let pretty = text;
                try {
                  pretty = JSON.stringify(JSON.parse(text), null, 2);
                } catch {
                  // keep raw text
                }
                setStatus(`${res.status} ${res.statusText}`);
                setResponse(pretty || '(empty body)');
              } catch (error) {
                setStatus('error');
                setResponse(error instanceof ApiError ? error.message : String(error));
              } finally {
                setPending(false);
              }
            })();
          }}
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={method}
              onChange={(event) => setMethod(event.target.value as HttpMethod)}
              className="ui-field font-mono sm:w-28"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="DELETE">DELETE</option>
            </select>
            <input value={path} onChange={(event) => setPath(event.target.value)} className="ui-field font-mono" />
            <button type="submit" disabled={pending} className="ui-btn-accent disabled:opacity-60">
              {pending ? 'Sending…' : 'Send'}
            </button>
          </div>

          {(method === 'POST' || method === 'DELETE') && (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink">Body</span>
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={10}
                className="ui-field font-mono text-xs"
                placeholder={method === 'POST' ? '{ }' : 'Optional'}
              />
            </label>
          )}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-ink">Response</p>
              <p className="font-mono text-xs text-mute">{status}</p>
            </div>
            <pre className="max-h-[420px] overflow-auto border border-white/10 bg-ink p-4 font-mono text-xs leading-relaxed text-orange-100">
              {response}
            </pre>
          </div>
        </form>
      </div>
    </div>
  );
}
