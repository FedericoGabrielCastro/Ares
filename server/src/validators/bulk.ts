import { z } from 'zod';
import { createJobSchema } from './job.js';

export const bulkCreateJobsSchema = z.object({
  jobs: z.array(createJobSchema).min(1).max(25),
});

export type BulkCreateJobsBody = z.infer<typeof bulkCreateJobsSchema>;
