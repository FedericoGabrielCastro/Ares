import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import request from 'supertest';
import { loadEnv } from './config/env.js';
import { createLogger } from './utils/logger.js';
import { createApp, createContext } from './app.js';

describe('Ares API', () => {
  const env = loadEnv({
    ...process.env,
    NODE_ENV: 'test',
    PORT: '4000',
    LOG_LEVEL: 'fatal',
    QUEUE_CONCURRENCY: '1',
  });
  const logger = createLogger(env);
  const ctx = createContext(env, logger);
  const app = createApp(ctx);

  after(async () => {
    await ctx.queue.drain(2_000);
  });

  it('returns health status', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
  });

  it('creates and completes a transform job', async () => {
    const created = await request(app)
      .post('/api/jobs')
      .send({ type: 'transform', input: { text: 'ares', mode: 'upper' } });

    assert.equal(created.status, 201);
    const jobId = created.body.data.id as string;

    let status = 'queued';
    for (let attempt = 0; attempt < 40 && status !== 'completed' && status !== 'failed'; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      const detail = await request(app).get(`/api/jobs/${jobId}`);
      status = detail.body.data.status;
      if (status === 'completed') {
        assert.equal(detail.body.data.result.data.output, 'ARES');
        return;
      }
    }

    assert.fail(`Job did not complete in time (last status: ${status})`);
  });

  it('rejects invalid payloads', async () => {
    const res = await request(app).post('/api/jobs').send({ type: 'transform', input: {} });
    assert.equal(res.status, 400);
  });

  it('lists jobs with pagination metadata', async () => {
    const res = await request(app).get('/api/jobs?limit=5&page=1');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.equal(res.body.meta.page, 1);
  });

  it('seeds sample jobs once', async () => {
    const first = await request(app).post('/api/jobs/seed');
    assert.ok(first.status === 200 || first.status === 201);
    assert.ok(typeof first.body.data.created === 'number');

    const second = await request(app).post('/api/jobs/seed');
    assert.equal(second.status, 200);
    assert.equal(second.body.data.created, 0);
  });

  it('creates jobs in bulk', async () => {
    const res = await request(app)
      .post('/api/jobs/bulk')
      .send({
        jobs: [
          { type: 'hash', input: { text: 'bulk-a' } },
          { type: 'transform', input: { text: 'bulk-b', mode: 'lower' } },
        ],
      });
    assert.equal(res.status, 201);
    assert.equal(res.body.meta.count, 2);
  });
});
