import { EventEmitter } from 'node:events';
import type { Logger } from '../utils/logger.js';
import type { Job } from '../types/job.js';
import type { JobStore } from './jobStore.js';
import { processJob } from './processors.js';

export class JobQueue extends EventEmitter {
  private readonly pending: string[] = [];
  private active = 0;
  private stopped = false;

  constructor(
    private readonly store: JobStore,
    private readonly logger: Logger,
    private readonly concurrency: number,
  ) {
    super();
  }

  enqueue(jobId: string): void {
    if (this.stopped) {
      throw new Error('Queue is shutting down');
    }
    this.pending.push(jobId);
    this.emit('enqueued', jobId);
    this.pump();
  }

  size(): number {
    return this.pending.length;
  }

  running(): number {
    return this.active;
  }

  getConcurrency(): number {
    return this.concurrency;
  }

  async drain(timeoutMs = 10_000): Promise<void> {
    this.stopped = true;
    const started = Date.now();
    while (this.active > 0 && Date.now() - started < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  private pump(): void {
    while (!this.stopped && this.active < this.concurrency && this.pending.length > 0) {
      const jobId = this.pending.shift();
      if (!jobId) return;
      this.active += 1;
      void this.run(jobId).finally(() => {
        this.active -= 1;
        this.pump();
      });
    }
  }

  private async run(jobId: string): Promise<void> {
    const job = this.store.get(jobId);
    if (!job) {
      this.logger.warn({ jobId }, 'Skipping missing job');
      return;
    }

    if (job.status === 'cancelled') {
      return;
    }

    const startedAt = new Date().toISOString();
    this.store.setStatus(jobId, 'running', {
      startedAt,
      attempts: job.attempts + 1,
    });
    this.emit('started', jobId);

    try {
      const current = this.store.get(jobId) as Job;
      const result = await processJob(current);
      const latest = this.store.get(jobId);
      if (!latest || latest.status === 'cancelled') {
        return;
      }

      this.store.setStatus(jobId, 'completed', {
        result,
        finishedAt: new Date().toISOString(),
        error: undefined,
      });
      this.store.markProcessed(result.durationMs);
      this.emit('completed', jobId);
      this.logger.info({ jobId, type: current.type, durationMs: result.durationMs }, 'Job completed');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown processing error';
      const latest = this.store.get(jobId);
      if (!latest || latest.status === 'cancelled') {
        return;
      }
      this.store.setStatus(jobId, 'failed', {
        error: message,
        finishedAt: new Date().toISOString(),
      });
      this.emit('failed', jobId, message);
      this.logger.error({ jobId, err: message }, 'Job failed');
    }
  }
}
