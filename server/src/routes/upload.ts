import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import type { Env } from '../config/env.js';
import type { JobQueue } from '../services/jobQueue.js';
import type { JobStore } from '../services/jobStore.js';
import { AppError } from '../utils/errors.js';

export function createUploadRouter(
  env: Env,
  store: JobStore,
  queue: JobQueue,
): Router {
  const router = Router();
  const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);

  fs.mkdirSync(uploadDir, { recursive: true });

  const upload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, uploadDir),
      filename: (_req, file, cb) => {
        const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${Date.now()}-${safe}`);
      },
    }),
    limits: { fileSize: env.MAX_UPLOAD_BYTES, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.startsWith('text/') && file.mimetype !== 'application/json') {
        cb(new AppError(415, 'Only text or JSON uploads are supported'));
        return;
      }
      cb(null, true);
    },
  });

  router.post('/text-stats', upload.single('file'), (req, res, next) => {
    try {
      if (!req.file) {
        throw new AppError(400, 'file field is required');
      }

      const text = fs.readFileSync(req.file.path, 'utf8');
      fs.unlink(req.file.path, () => undefined);

      const job = store.create({
        type: 'text-stats',
        input: { text },
      });
      queue.enqueue(job.id);
      res.status(201).json({
        data: job,
        meta: {
          originalName: req.file.originalname,
          bytes: req.file.size,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
