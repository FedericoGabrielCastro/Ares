import { Router } from 'express';
import type { JobQueue } from '../services/jobQueue.js';
import type { JobStore } from '../services/jobStore.js';
import { shortCache } from '../middleware/shortCache.js';

export function createStatsRouter(store: JobStore, queue: JobQueue): Router {
  const router = Router();

  router.get('/', shortCache(1_000), (_req, res) => {
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
