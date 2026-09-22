import path from 'node:path';
import fs from 'node:fs';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import type { Env } from './config/env.js';
import type { Logger } from './utils/logger.js';
import { JobStore } from './services/jobStore.js';
import { JobQueue } from './services/jobQueue.js';
import { requestId } from './middleware/requestId.js';
import { timing } from './middleware/timing.js';
import { createErrorHandler, notFound } from './middleware/errorHandler.js';
import { createHealthRouter } from './routes/health.js';
import { createJobsRouter } from './routes/jobs.js';
import { createStatsRouter } from './routes/stats.js';
import { createUploadRouter } from './routes/upload.js';

export interface AppContext {
  env: Env;
  logger: Logger;
  store: JobStore;
  queue: JobQueue;
}

export function createApp(ctx: AppContext) {
  const app = express();
  const clientDist = path.resolve(process.cwd(), '../client/dist');
  const hasClientBuild = fs.existsSync(path.join(clientDist, 'index.html'));

  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );
  app.use(
    cors({
      origin: ctx.env.CORS_ORIGIN,
      exposedHeaders: ['x-request-id', 'x-response-time'],
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestId);
  app.use((req, _res, next) => {
    req.log = ctx.logger.child({ requestId: req.requestId });
    next();
  });
  app.use(timing);
  app.use(
    morgan(ctx.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
      skip: () => ctx.env.NODE_ENV === 'test',
    }),
  );
  app.use(
    rateLimit({
      windowMs: ctx.env.RATE_LIMIT_WINDOW_MS,
      max: ctx.env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: { message: 'Too many requests' } },
    }),
  );

  app.use('/api', createHealthRouter(ctx.store, ctx.queue));
  app.use('/api/jobs', createJobsRouter(ctx.store, ctx.queue));
  app.use('/api/stats', createStatsRouter(ctx.store, ctx.queue));
  app.use('/api/upload', createUploadRouter(ctx.env, ctx.store, ctx.queue));

  if (hasClientBuild) {
    app.use(express.static(clientDist));
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  } else {
    app.get('/', (_req, res) => {
      res.json({
        name: 'Ares API',
        version: '1.0.0',
        docs: {
          health: '/api/health',
          jobs: '/api/jobs',
          stats: '/api/stats',
          upload: '/api/upload/text-stats',
        },
      });
    });
    app.use(notFound);
  }

  app.use(createErrorHandler(ctx.logger));

  return app;
}

export function createContext(env: Env, logger: Logger): AppContext {
  const store = new JobStore();
  const queue = new JobQueue(store, logger, env.QUEUE_CONCURRENCY);
  return { env, logger, store, queue };
}
