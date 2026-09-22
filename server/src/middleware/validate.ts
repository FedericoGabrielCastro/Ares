import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { AppError } from '../utils/errors.js';

type RequestSlot = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, slot: RequestSlot = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req[slot]);
    if (!parsed.success) {
      next(
        new AppError(400, 'Validation failed', {
          issues: parsed.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        }),
      );
      return;
    }

    req[slot] = parsed.data as never;
    next();
  };
}
