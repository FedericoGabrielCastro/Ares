import path from 'node:path';
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
import { readJsonFile, writeJsonAtomic } from '../utils/fsJson.js';

interface PersistShape {
  jobs: Job[];
}

export interface JobStoreOptions {
  persistPath?: string;
}

export class JobStore extends EventEmitter {
  private readonly jobs = new Map<string, Job>();
  private readonly completedDurations: number[] = [];
  private readonly processedTimestamps: number[] = [];
  private readonly persistPath?: string;
  private persistTimer: NodeJS.Timeout | null = null;
  private persistQueued = false;

  constructor(options: JobStoreOptions = {}) {
    super();
    this.persistPath = options.persistPath
      ? path.resolve(options.persistPath)
      : undefined;
  }

  async load(): Promise<number> {
    if (!this.persistPath) return 0;
    const data = await readJsonFile<PersistShape>(this.persistPath, { jobs: [] });
    for (const job of data.jobs) {
      // Reset in-flight work so the queue can pick it up again after a restart.
      if (job.status === 'running' || job.status === 'queued') {
        job.status = 'queued';
        job.startedAt = undefined;
        job.finishedAt = undefined;
        job.error = undefined;
      }
      this.jobs.set(job.id, job);
    }
    return this.jobs.size;
  }

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
    this.schedulePersist();
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
    this.schedulePersist();
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
    this.schedulePersist();
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

  queuedIds(): string[] {
    return Array.from(this.jobs.values())
      .filter((job) => job.status === 'queued')
      .map((job) => job.id);
  }

  async flush(): Promise<void> {
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }
    await this.persistNow();
  }

  private schedulePersist(): void {
    if (!this.persistPath) return;
    this.persistQueued = true;
    if (this.persistTimer) return;
    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      void this.persistNow();
    }, 150);
    this.persistTimer.unref?.();
  }

  private async persistNow(): Promise<void> {
    if (!this.persistPath || !this.persistQueued) return;
    this.persistQueued = false;
    const payload: PersistShape = {
      jobs: Array.from(this.jobs.values()),
    };
    await writeJsonAtomic(this.persistPath, payload);
  }

  private pruneProcessedTimestamps(now: number): void {
    const cutoff = now - 60_000;
    while (this.processedTimestamps.length > 0 && this.processedTimestamps[0]! < cutoff) {
      this.processedTimestamps.shift();
    }
  }
}
