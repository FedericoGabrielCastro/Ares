import type { JobQueue } from './jobQueue.js';
import type { JobStore } from './jobStore.js';
import type { CreateJobPayload } from '../types/job.js';

const samples: CreateJobPayload[] = [
  {
    type: 'text-stats',
    input: {
      text: 'Ares streams payloads through NodeReadable paths and counts every word along the way.',
    },
  },
  {
    type: 'hash',
    input: {
      text: 'worker-thread-demo-payload',
    },
  },
  {
    type: 'transform',
    input: {
      text: 'process me',
      mode: 'upper',
    },
  },
  {
    type: 'csv-aggregate',
    input: {
      csv: 'sku,units\nA1,12\nB2,8\nC3,21',
      column: 'units',
    },
  },
  {
    type: 'delay',
    input: {
      delayMs: 800,
    },
  },
];

export function seedSampleJobs(store: JobStore, queue: JobQueue): number {
  if (store.stats(queue.getConcurrency()).total > 0) {
    return 0;
  }

  for (const sample of samples) {
    const job = store.create(sample);
    queue.enqueue(job.id);
  }

  return samples.length;
}
