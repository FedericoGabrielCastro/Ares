import type { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      log?: {
        info: (obj: unknown, msg?: string) => void;
        error: (obj: unknown, msg?: string) => void;
        warn: (obj: unknown, msg?: string) => void;
      };
    }
  }
}

export type AuthedRequest = Request;
