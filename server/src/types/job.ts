export type JobType = 'text-stats' | 'hash' | 'transform' | 'delay' | 'csv-aggregate';

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export type TransformMode = 'upper' | 'lower' | 'reverse';

export interface JobInput {
  text?: string;
  mode?: TransformMode;
  delayMs?: number;
  csv?: string;
  column?: string;
}

export interface JobResult {
  summary: string;
  data: Record<string, unknown>;
  durationMs: number;
}

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  input: JobInput;
  result?: JobResult;
  error?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  finishedAt?: string;
  attempts: number;
}

export interface CreateJobPayload {
  type: JobType;
  input: JobInput;
}

export interface JobListQuery {
  status?: JobStatus;
  type?: JobType;
  page: number;
  limit: number;
  sort: 'createdAt' | 'updatedAt';
  order: 'asc' | 'desc';
  q?: string;
}

export interface Paginated<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface QueueStats {
  queued: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
  total: number;
  concurrency: number;
  processedLastMinute: number;
  averageDurationMs: number;
}
