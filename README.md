# Ares

A lightweight job processing platform built with **Node.js**, **Express**, and **React**.

Submit processing jobs, watch them move through a queue, inspect results, and explore a clean REST API — all without authentication clutter.

## Stack

| Layer | Tech |
| --- | --- |
| API | Node.js, Express |
| Processing | In-process queue, streams, worker threads |
| UI | React, Vite, TanStack Query, Tailwind CSS |
| Validation | Zod |
| Language | TypeScript (end to end) |

## Features

- REST API for jobs, stats, and health checks
- Background job queue with lifecycle events
- Stream-based payload processing
- Worker-thread CPU tasks (word stats, hashing)
- Pagination, filtering, and sorting
- React dashboard powered by TanStack Query
- Minimal, modern UI with Tailwind CSS

## Quick start

```bash
# Install dependencies (root workspaces)
npm install

# Run API + UI in development
npm run dev
```

- API: `http://localhost:4000`
- UI: `http://localhost:5173`

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start API and UI concurrently |
| `npm run build` | Build API and UI for production |
| `npm run start` | Run the production API |
| `npm test` | Run API tests |

## Project structure

```
Ares/
├── server/          # Express REST API + processing engine
├── client/          # React + Vite + TanStack Query
└── package.json     # Workspaces root
```

## API overview

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Liveness probe |
| `GET` | `/api/jobs` | List jobs (filter, sort, paginate) |
| `POST` | `/api/jobs` | Create a job |
| `GET` | `/api/jobs/:id` | Job detail |
| `DELETE` | `/api/jobs/:id` | Cancel / remove a job |
| `GET` | `/api/stats` | Queue and throughput metrics |
| `POST` | `/api/jobs/:id/retry` | Re-queue a failed job |

## License

MIT
