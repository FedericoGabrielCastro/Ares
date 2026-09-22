import type { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import type { Logger } from '../utils/logger.js';
import { isAppError } from '../utils/errors.js';

export function notFound(_req: Request, _res: Response, next: NextFunction): void {
  next(Object.assign(new Error('Route not found'), { statusCode: 404 }));
}

export function createErrorHandler(logger: Logger): ErrorRequestHandler {
  return (err, req, res, _next) => {
    if (isAppError(err)) {
      res.status(err.statusCode).json({
        error: {
          message: err.message,
          details: err.details,
          requestId: req.requestId,
        },
      });
      return;
    }

    if (err instanceof ZodError) {
      res.status(400).json({
        error: {
          message: 'Validation failed',
          details: err.issues,
          requestId: req.requestId,
        },
      });
      return;
    }

    const statusCode =
      typeof err === 'object' && err && 'statusCode' in err && typeof err.statusCode === 'number'
        ? err.statusCode
        : 500;

    const message =
      statusCode === 404
        ? 'Route not found'
        : err instanceof Error
          ? err.message
          : 'Internal server error';

    if (statusCode >= 500) {
      logger.error({ err, requestId: req.requestId }, 'Unhandled error');
    }

    res.status(statusCode).json({
      error: {
        message: statusCode >= 500 ? 'Internal server error' : message,
        requestId: req.requestId,
      },
    });
  };
}
