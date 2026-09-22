import type { NextFunction, Request, Response } from 'express';

export function timing(req: Request, res: Response, next: NextFunction): void {
  const started = process.hrtime.bigint();

  const originalEnd = res.end.bind(res);
  // Patch end so the timing header is set before the response is flushed.
  res.end = ((...args: Parameters<typeof res.end>) => {
    const elapsedMs = Number(process.hrtime.bigint() - started) / 1_000_000;
    if (!res.headersSent) {
      res.setHeader('x-response-time', `${elapsedMs.toFixed(2)}ms`);
    }
    req.log?.info(
      {
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Number(elapsedMs.toFixed(2)),
        requestId: req.requestId,
      },
      'request completed',
    );
    return originalEnd(...args);
  }) as typeof res.end;

  next();
}
