import { z } from 'zod';

export const jobTypeSchema = z.enum([
  'text-stats',
  'hash',
  'transform',
  'delay',
  'csv-aggregate',
]);

export const transformModeSchema = z.enum(['upper', 'lower', 'reverse']);

export const jobInputSchema = z
  .object({
    text: z.string().max(100_000).optional(),
    mode: transformModeSchema.optional(),
    delayMs: z.number().int().min(0).max(30_000).optional(),
    csv: z.string().max(200_000).optional(),
    column: z.string().min(1).max(64).optional(),
  })
  .strict();

export const createJobSchema = z
  .object({
    type: jobTypeSchema,
    input: jobInputSchema.default({}),
  })
  .superRefine((value, ctx) => {
    if (value.type === 'text-stats' || value.type === 'hash' || value.type === 'transform') {
      if (!value.input.text || value.input.text.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'input.text is required for this job type',
          path: ['input', 'text'],
        });
      }
    }

    if (value.type === 'transform' && !value.input.mode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'input.mode is required for transform jobs',
        path: ['input', 'mode'],
      });
    }

    if (value.type === 'csv-aggregate') {
      if (!value.input.csv || value.input.csv.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'input.csv is required for csv-aggregate jobs',
          path: ['input', 'csv'],
        });
      }
      if (!value.input.column) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'input.column is required for csv-aggregate jobs',
          path: ['input', 'column'],
        });
      }
    }
  });

export const jobListQuerySchema = z.object({
  status: z.enum(['queued', 'running', 'completed', 'failed', 'cancelled']).optional(),
  type: jobTypeSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['createdAt', 'updatedAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  q: z.string().trim().min(1).max(100).optional(),
});

export type CreateJobBody = z.infer<typeof createJobSchema>;
export type JobListQueryBody = z.infer<typeof jobListQuerySchema>;
