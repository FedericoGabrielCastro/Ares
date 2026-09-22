import { Router } from 'express';
import type { JobQueue } from '../services/jobQueue.js';
import type { JobStore } from '../services/jobStore.js';
import { validate } from '../middleware/validate.js';
import { createJobSchema, jobListQuerySchema } from '../validators/job.js';
import { bulkCreateJobsSchema } from '../validators/bulk.js';
import { seedSampleJobs } from '../services/seed.js';
import { AppError } from '../utils/errors.js';

export function createJobsRouter(store: JobStore, queue: JobQueue): Router {
  const router = Router();

  router.get('/', validate(jobListQuerySchema, 'query'), (req, res) => {
    const result = store.list(req.query as never);
    res.json(result);
  });

  router.post('/', validate(createJobSchema), (req, res) => {
    const job = store.create(req.body);
    queue.enqueue(job.id);
    res.status(201).json({ data: job });
  });

  router.post('/bulk', validate(bulkCreateJobsSchema), (req, res) => {
    const jobs = req.body.jobs.map((payload: { type: string; input: object }) => {
      const job = store.create(payload as never);
      queue.enqueue(job.id);
      return job;
    });
    res.status(201).json({ data: jobs, meta: { count: jobs.length } });
  });

  router.post('/seed', (_req, res) => {
    const created = seedSampleJobs(store, queue);
    res.status(created > 0 ? 201 : 200).json({
      data: { created },
      message: created > 0 ? 'Sample jobs enqueued' : 'Store already has jobs; seed skipped',
    });
  });

  router.get('/:id', (req, res) => {
    const job = store.get(req.params.id!);
    if (!job) {
      throw new AppError(404, 'Job not found');
    }
    res.json({ data: job });
  });

  router.delete('/:id', (req, res) => {
    const job = store.get(req.params.id!);
    if (!job) {
      throw new AppError(404, 'Job not found');
    }

    if (job.status === 'queued' || job.status === 'running') {
      store.setStatus(job.id, 'cancelled', {
        finishedAt: new Date().toISOString(),
        error: 'Cancelled by client',
      });
      res.json({ data: store.get(job.id) });
      return;
    }

    store.remove(job.id);
    res.status(204).send();
  });

  router.post('/:id/retry', (req, res) => {
    const job = store.get(req.params.id!);
    if (!job) {
      throw new AppError(404, 'Job not found');
    }
    if (job.status !== 'failed' && job.status !== 'cancelled') {
      throw new AppError(409, 'Only failed or cancelled jobs can be retried');
    }

    const updated = store.setStatus(job.id, 'queued', {
      error: undefined,
      result: undefined,
      startedAt: undefined,
      finishedAt: undefined,
    });
    queue.enqueue(job.id);
    res.json({ data: updated });
  });

  return router;
}
