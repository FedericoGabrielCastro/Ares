import { EventEmitter } from 'node:events';
import { nanoid } from 'nanoid';
import type {
  CreateJobPayload,
  Job,
  JobListQuery,
  JobStatus,
  Paginated,
  QueueStats,
} from '../types/job.js';

export class JobStore extends EventEmitter {
  private readonly jobs = new Map<string, Job>();
  private readonly completedDurations: number[] = [];
  private readonly processedTimestamps: number[] = [];

  create(payload: CreateJobPayload): Job {
    const now = new Date().toISOString();
    const job: Job = {
      id: nanoid(12),
      type: payload.type,
      status: 'queued',
      input: payload.input,
      createdAt: now,
      updatedAt: now,
      attempts: 0,
    };
    this.jobs.set(job.id, job);
    this.emit('created', job);
    return structuredClone(job);
  }

  get(id: string): Job | undefined {
    const job = this.jobs.get(id);
    return job ? structuredClone(job) : undefined;
  }

  list(query: JobListQuery): Paginated<Job> {
    let items = Array.from(this.jobs.values());

    if (query.status) {
      items = items.filter((job) => job.status === query.status);
    }
    if (query.type) {
      items = items.filter((job) => job.type === query.type);
    }
    if (query.q) {
      const needle = query.q.toLowerCase();
      items = items.filter(
        (job) =>
          job.id.toLowerCase().includes(needle) ||
          job.type.toLowerCase().includes(needle) ||
          job.status.toLowerCase().includes(needle) ||
          JSON.stringify(job.input).toLowerCase().includes(needle),
      );
    }

    items.sort((a, b) => {
      const left = a[query.sort];
      const right = b[query.sort];
      const cmp = left.localeCompare(right);
      return query.order === 'asc' ? cmp : -cmp;
    });

    const total = items.length;
    const start = (query.page - 1) * query.limit;
    const data = items.slice(start, start + query.limit).map((job) => structuredClone(job));

    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  update(id: string, patch: Partial<Job>): Job | undefined {
    const current = this.jobs.get(id);
    if (!current) return undefined;

    const next: Job = {
      ...current,
      ...patch,
      id: current.id,
      updatedAt: new Date().toISOString(),
    };
    this.jobs.set(id, next);
    this.emit('updated', next);
    return structuredClone(next);
  }

  setStatus(id: string, status: JobStatus, extra: Partial<Job> = {}): Job | undefined {
    return this.update(id, { status, ...extra });
  }

  remove(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;
    this.jobs.delete(id);
    this.emit('removed', job);
    return true;
  }

  markProcessed(durationMs: number): void {
    this.completedDurations.push(durationMs);
    if (this.completedDurations.length > 200) {
      this.completedDurations.shift();
    }
    const now = Date.now();
    this.processedTimestamps.push(now);
    this.pruneProcessedTimestamps(now);
  }

  stats(concurrency: number): QueueStats {
    const counts: Record<JobStatus, number> = {
      queued: 0,
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };

    for (const job of this.jobs.values()) {
      counts[job.status] += 1;
    }

    this.pruneProcessedTimestamps(Date.now());
    const averageDurationMs =
      this.completedDurations.length === 0
        ? 0
        : Math.round(
            this.completedDurations.reduce((sum, value) => sum + value, 0) /
              this.completedDurations.length,
          );

    return {
      ...counts,
      total: this.jobs.size,
      concurrency,
      processedLastMinute: this.processedTimestamps.length,
      averageDurationMs,
    };
  }

  private pruneProcessedTimestamps(now: number): void {
    const cutoff = now - 60_000;
    while (this.processedTimestamps.length > 0 && this.processedTimestamps[0]! < cutoff) {
      this.processedTimestamps.shift();
    }
  }
}
