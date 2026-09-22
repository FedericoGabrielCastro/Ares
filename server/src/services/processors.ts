import { Readable } from 'node:stream';
import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { Job, JobResult } from '../types/job.js';

const workerPath = fileURLToPath(new URL('../workers/hashWorker.ts', import.meta.url));

async function readTextStats(text: string): Promise<JobResult['data']> {
  let characters = 0;
  let words = 0;
  let lines = 0;
  let inWord = false;

  // Stream the payload so larger inputs follow the same path as file uploads.
  const source = Readable.from([text], { encoding: 'utf8' });
  for await (const chunk of source) {
    const value = String(chunk);
    characters += value.length;
    for (const char of value) {
      if (char === '\n') lines += 1;
      const isSpace = /\s/.test(char);
      if (!isSpace && !inWord) {
        inWord = true;
        words += 1;
      } else if (isSpace) {
        inWord = false;
      }
    }
  }

  if (text.length > 0 && !text.endsWith('\n')) {
    lines += 1;
  }

  return {
    characters,
    words,
    lines,
    averageWordLength: words === 0 ? 0 : Number((characters / words).toFixed(2)),
  };
}

async function runHashWorker(text: string): Promise<JobResult['data']> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerPath, {
      workerData: { text },
      execArgv: path.extname(workerPath) === '.ts' ? ['--import', 'tsx'] : undefined,
    });

    worker.once('message', (message) => resolve(message as JobResult['data']));
    worker.once('error', reject);
    worker.once('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Hash worker exited with code ${code}`));
      }
    });
  });
}

function transformText(text: string, mode: 'upper' | 'lower' | 'reverse'): string {
  switch (mode) {
    case 'upper':
      return text.toUpperCase();
    case 'lower':
      return text.toLowerCase();
    case 'reverse':
      return [...text].reverse().join('');
    default:
      return text;
  }
}

function aggregateCsv(csv: string, column: string): JobResult['data'] {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error('CSV must include a header row and at least one data row');
  }

  const headers = lines[0]!.split(',').map((header) => header.trim());
  const index = headers.indexOf(column);
  if (index === -1) {
    throw new Error(`Column "${column}" was not found in CSV header`);
  }

  let sum = 0;
  let count = 0;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (const line of lines.slice(1)) {
    const cells = line.split(',').map((cell) => cell.trim());
    const raw = cells[index];
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      throw new Error(`Non-numeric value "${raw}" in column "${column}"`);
    }
    sum += value;
    count += 1;
    min = Math.min(min, value);
    max = Math.max(max, value);
  }

  return {
    column,
    rows: count,
    sum,
    average: count === 0 ? 0 : Number((sum / count).toFixed(4)),
    min: count === 0 ? 0 : min,
    max: count === 0 ? 0 : max,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function processJob(job: Job): Promise<JobResult> {
  const started = Date.now();

  switch (job.type) {
    case 'text-stats': {
      const data = await readTextStats(job.input.text ?? '');
      return {
        summary: `Counted ${data.words} words across ${data.lines} lines`,
        data,
        durationMs: Date.now() - started,
      };
    }
    case 'hash': {
      const data = await runHashWorker(job.input.text ?? '');
      return {
        summary: `Computed ${String(data.algorithm)} digest`,
        data,
        durationMs: Date.now() - started,
      };
    }
    case 'transform': {
      const mode = job.input.mode ?? 'upper';
      const output = transformText(job.input.text ?? '', mode);
      return {
        summary: `Transformed text with mode "${mode}"`,
        data: { mode, output, length: output.length },
        durationMs: Date.now() - started,
      };
    }
    case 'delay': {
      const delayMs = job.input.delayMs ?? 1000;
      await sleep(delayMs);
      return {
        summary: `Slept for ${delayMs}ms`,
        data: { delayMs },
        durationMs: Date.now() - started,
      };
    }
    case 'csv-aggregate': {
      const data = aggregateCsv(job.input.csv ?? '', job.input.column ?? 'value');
      return {
        summary: `Aggregated column "${String(data.column)}" over ${String(data.rows)} rows`,
        data,
        durationMs: Date.now() - started,
      };
    }
    default: {
      const exhaustive: never = job.type;
      throw new Error(`Unsupported job type: ${exhaustive}`);
    }
  }
}
