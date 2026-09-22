# Ares

**Ares** is a TypeScript job-processing platform: an Express REST API with a real in-process queue, plus a React dashboard that tracks work live.

Create jobs (text stats, hashing, transforms, CSV aggregates, delays), watch them move through the queue, inspect results, and poke the API from an in-app explorer — no auth layer, no database required to get started.

<p align="center">
  <img alt="Node" src="https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=nodedotjs&logoColor=white" />
  <img alt="Express" src="https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img alt="License" src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" />
</p>

## Why this project

Ares is built to exercise the parts of Node and Express that usually get skipped in toy demos:

| Area | What you get |
| --- | --- |
| HTTP API | Routers, Zod validation, rate limits, Helmet, CORS, compression, request IDs |
| Processing | Concurrency-limited queue, Node streams, `worker_threads`, EventEmitter lifecycle |
| Realtime | Server-Sent Events for job/queue updates |
| Ops | Health/ready probes, graceful shutdown, optional JSON persistence, Docker |
| Frontend | Vite + React + TanStack Query + Tailwind, with an API explorer page |

## Architecture

```text
┌─────────────┐   REST / SSE    ┌──────────────────────┐
│  React UI   │ ──────────────► │  Express API         │
│  TanStack   │ ◄────────────── │  middleware + routes │
│  Query      │                 └──────────┬───────────┘
└─────────────┘                            │
                                           ▼
                                ┌──────────────────────┐
                                │  JobStore + JobQueue │
                                │  (EventEmitter)      │
                                └──────────┬───────────┘
                                           │
                     ┌─────────────────────┼─────────────────────┐
                     ▼                     ▼                     ▼
               streams               worker_threads          timers / CSV
             (text-stats)               (hash)              (delay / agg)
```

## Quick start

**Requirements:** Node.js 20+

```bash
git clone git@github.com:FedericoGabrielCastro/Ares.git
cd Ares
npm install
npm run dev
```

| Service | URL |
| --- | --- |
| UI (Vite) | http://localhost:5173 |
| API | http://localhost:4000 |
| API explorer (in UI) | http://localhost:5173/api-explorer |

The Vite dev server proxies `/api` to the Express process, so the browser can call the API without CORS friction.

### Try it in 30 seconds

```bash
# Health
curl -s http://localhost:4000/api/health | jq

# Create a transform job
curl -s -X POST http://localhost:4000/api/jobs \
  -H 'content-type: application/json' \
  -d '{"type":"transform","input":{"text":"ares","mode":"upper"}}' | jq

# Seed demo jobs
curl -s -X POST http://localhost:4000/api/jobs/seed | jq
```

Or open the UI and click **Load samples**.

## Docker

Run API + built UI in one container:

```bash
docker compose up --build
```

Open http://localhost:4000 — job history persists in the `ares-data` volume.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | API + UI in watch mode |
| `npm run build` | Compile server and build the client |
| `npm start` | Run the production API (serves `client/dist` when present) |
| `npm test` | Server tests (Node test runner + Supertest) |
| `npm run lint` | Typecheck server and client |
| `docker compose up --build` | Production container via Compose |

## Job types

| Type | Engine | Input | Result |
| --- | --- | --- | --- |
| `text-stats` | Readable stream | `text` | words, lines, characters |
| `hash` | Worker thread | `text` | SHA-256 digest |
| `transform` | Sync CPU | `text`, `mode` (`upper` \| `lower` \| `reverse`) | transformed string |
| `delay` | Timer | `delayMs` (optional) | simulated latency |
| `csv-aggregate` | Parser | `csv`, `column` | sum / avg / min / max |

## API

### Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Liveness |
| `GET` | `/api/ready` | Readiness + queue snapshot |
| `GET` | `/api/jobs` | List jobs (filter, sort, paginate) |
| `POST` | `/api/jobs` | Create one job |
| `POST` | `/api/jobs/bulk` | Create up to 25 jobs |
| `POST` | `/api/jobs/seed` | Enqueue demo samples (no-op if store isn’t empty) |
| `GET` | `/api/jobs/:id` | Job detail |
| `DELETE` | `/api/jobs/:id` | Cancel running/queued, or delete finished |
| `POST` | `/api/jobs/:id/retry` | Re-queue failed/cancelled jobs |
| `GET` | `/api/stats` | Throughput + memory metrics |
| `POST` | `/api/upload/text-stats` | Multipart text/JSON upload → job |
| `GET` | `/api/events/stream` | SSE stream (`job`, `queue`, heartbeats) |

### List query params

| Param | Default | Notes |
| --- | --- | --- |
| `page` | `1` | Page number |
| `limit` | `20` | Max `100` |
| `status` | — | `queued` \| `running` \| `completed` \| `failed` \| `cancelled` |
| `type` | — | One of the job types above |
| `sort` | `createdAt` | `createdAt` \| `updatedAt` |
| `order` | `desc` | `asc` \| `desc` |
| `q` | — | Free-text search over id / type / status / input |

### Example payloads

```bash
# Hash job
curl -s -X POST http://localhost:4000/api/jobs \
  -H 'content-type: application/json' \
  -d '{"type":"hash","input":{"text":"hello ares"}}' | jq

# CSV aggregate
curl -s -X POST http://localhost:4000/api/jobs \
  -H 'content-type: application/json' \
  -d '{"type":"csv-aggregate","input":{"csv":"name,value\na,10\nb,5","column":"value"}}' | jq

# Bulk
curl -s -X POST http://localhost:4000/api/jobs/bulk \
  -H 'content-type: application/json' \
  -d '{"jobs":[{"type":"delay","input":{"delayMs":500}},{"type":"transform","input":{"text":"ok","mode":"upper"}}]}' | jq
```

## UI

| Route | Purpose |
| --- | --- |
| `/` | Dashboard — queue meter, recent jobs, runtime stats |
| `/jobs` | Filterable job history |
| `/jobs/new` | Create a job |
| `/jobs/:id` | Detail, retry, cancel/delete |
| `/api-explorer` | Hit REST endpoints from the browser |

Live updates use TanStack Query polling plus `/api/events/stream` to invalidate caches when the queue changes.

## Configuration

Copy `server/.env.example` or export variables before starting the API:

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `4000` | HTTP port |
| `NODE_ENV` | `development` | `development` \| `test` \| `production` |
| `LOG_LEVEL` | `info` | Pino log level |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed browser origin |
| `QUEUE_CONCURRENCY` | `2` | Parallel workers |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate-limit window |
| `RATE_LIMIT_MAX` | `120` | Max requests per window |
| `UPLOAD_DIR` | `uploads` | Multipart destination |
| `MAX_UPLOAD_BYTES` | `2097152` | Upload size cap (2 MB) |
| `DATA_DIR` | `data` | Persistence directory |
| `PERSIST_JOBS` | `true` | Write jobs to `DATA_DIR/jobs.json` |
| `SEED_ON_BOOT` | `true` | Auto-seed samples in development |
| `CLIENT_DIST` | _(optional)_ | Absolute path to the Vite build |

## Project structure

```text
Ares/
├── client/                 # React + Vite + TanStack Query + Tailwind
│   └── src/
│       ├── api/            # Fetch wrappers
│       ├── hooks/          # Query / mutation / SSE hooks
│       ├── pages/          # Dashboard, jobs, explorer
│       └── components/     # Layout, status badge
├── server/                 # Express API + processing engine
│   └── src/
│       ├── middleware/     # validation, timing, cache, errors
│       ├── routes/         # health, jobs, stats, upload, events
│       ├── services/       # store, queue, processors, seed
│       ├── workers/        # hash worker thread
│       └── validators/     # Zod schemas
├── .github/workflows/      # CI (lint + test + build)
├── Dockerfile
├── docker-compose.yml
└── package.json            # npm workspaces root
```

## Testing & CI

```bash
npm test
npm run lint
npm run build
```

GitHub Actions runs the same checks on every pull request (`server` tests + `client` build).

## License

MIT
