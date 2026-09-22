import type { RequestHandler } from 'express';

interface CacheEntry {
  expiresAt: number;
  statusCode: number;
  body: unknown;
}

/** Tiny in-memory GET cache for low-churn endpoints like /api/stats. */
export function shortCache(ttlMs: number): RequestHandler {
  const entries = new Map<string, CacheEntry>();

  return (req, res, next) => {
    if (req.method !== 'GET') {
      next();
      return;
    }

    const key = req.originalUrl;
    const hit = entries.get(key);
    if (hit && hit.expiresAt > Date.now()) {
      res.setHeader('x-cache', 'HIT');
      res.status(hit.statusCode).json(hit.body);
      return;
    }

    const originalJson = res.json.bind(res);
    res.json = ((body: unknown) => {
      entries.set(key, {
        expiresAt: Date.now() + ttlMs,
        statusCode: res.statusCode || 200,
        body,
      });
      res.setHeader('x-cache', 'MISS');
      return originalJson(body);
    }) as typeof res.json;

    next();
  };
}
