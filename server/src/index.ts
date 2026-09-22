import http from 'node:http';
import { loadEnv } from './config/env.js';
import { createLogger } from './utils/logger.js';
import { createApp, createContext } from './app.js';
import { seedSampleJobs } from './services/seed.js';

async function main(): Promise<void> {
  const env = loadEnv();
  const logger = createLogger(env);
  const ctx = createContext(env, logger);
  const app = createApp(ctx);
  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Ares API listening');
    if (env.NODE_ENV === 'development') {
      const created = seedSampleJobs(ctx.store, ctx.queue);
      if (created > 0) {
        logger.info({ created }, 'Seeded sample jobs');
      }
    }
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down gracefully');
    server.close(async () => {
      await ctx.queue.drain(8_000);
      logger.info('Shutdown complete');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
