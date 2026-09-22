import { createHash } from 'node:crypto';
import { parentPort, workerData } from 'node:worker_threads';

interface HashWorkerInput {
  text: string;
}

const input = workerData as HashWorkerInput;
const digest = createHash('sha256').update(input.text).digest('hex');

parentPort?.postMessage({
  algorithm: 'sha256',
  digest,
  bytes: Buffer.byteLength(input.text, 'utf8'),
});
