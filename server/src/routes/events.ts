import { Router } from 'express';
import type { Response } from 'express';
import type { JobStore } from '../services/jobStore.js';
import type { JobQueue } from '../services/jobQueue.js';
import type { Job } from '../types/job.js';

interface StreamClient {
  id: number;
  res: Response;
}

export function createEventsRouter(store: JobStore, queue: JobQueue): Router {
  const router = Router();
  const clients = new Set<StreamClient>();
  let nextId = 1;

  const broadcast = (event: string, payload: unknown) => {
    const body = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const client of clients) {
      client.res.write(body);
    }
  };

  store.on('created', (job: Job) => broadcast('job', { action: 'created', job }));
  store.on('updated', (job: Job) => broadcast('job', { action: 'updated', job }));
  store.on('removed', (job: Job) => broadcast('job', { action: 'removed', job }));
  queue.on('enqueued', (jobId: string) => broadcast('queue', { action: 'enqueued', jobId }));
  queue.on('started', (jobId: string) => broadcast('queue', { action: 'started', jobId }));
  queue.on('completed', (jobId: string) => broadcast('queue', { action: 'completed', jobId }));
  queue.on('failed', (jobId: string, error: string) =>
    broadcast('queue', { action: 'failed', jobId, error }),
  );

  router.get('/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const client: StreamClient = { id: nextId++, res };
    clients.add(client);

    res.write(
      `event: connected\ndata: ${JSON.stringify({ clientId: client.id, at: new Date().toISOString() })}\n\n`,
    );
    res.write(
      `event: snapshot\ndata: ${JSON.stringify({
        stats: store.stats(queue.getConcurrency()),
        queueDepth: queue.size(),
        activeWorkers: queue.running(),
      })}\n\n`,
    );

    const heartbeat = setInterval(() => {
      res.write(`: ping ${Date.now()}\n\n`);
    }, 15_000);

    req.on('close', () => {
      clearInterval(heartbeat);
      clients.delete(client);
    });
  });

  return router;
}
