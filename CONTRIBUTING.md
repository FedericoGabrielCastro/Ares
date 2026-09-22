# Contributing

## Workflow

1. Create a feature branch from `main`.
2. Keep commits focused and written in English.
3. Open a pull request with a short summary and test plan.
4. Wait for CI (server tests + client build) before merging.

## Local checks

```bash
npm install
npm test
npm run build
```

## API notes

- Validation uses Zod on request bodies and query strings.
- Jobs are stored in memory for simplicity; restarting the API clears the queue.
- The Vite dev server proxies `/api` to `http://localhost:4000`.
