import { Router } from 'express';
import type { JobQueue } from '../services/jobQueue.js';
import type { JobStore } from '../services/jobStore.js';

export function createStatsRouter(store: JobStore, queue: JobQueue): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    const stats = store.stats(queue.getConcurrency());
    res.json({
      data: {
        ...stats,
        queueDepth: queue.size(),
        activeWorkers: queue.running(),
        memory: {
          rss: process.memoryUsage().rss,
          heapUsed: process.memoryUsage().heapUsed,
        },
        node: process.version,
      },
    });
  });

  return router;
}
