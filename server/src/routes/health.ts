import { Router } from 'express';
import type { JobQueue } from '../services/jobQueue.js';
import type { JobStore } from '../services/jobStore.js';

export function createHealthRouter(store: JobStore, queue: JobQueue): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      uptimeSec: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  router.get('/ready', (_req, res) => {
    res.json({
      status: 'ready',
      queueSize: queue.size(),
      running: queue.running(),
      jobs: store.stats(queue.getConcurrency()).total,
    });
  });

  return router;
}
