import type { NextFunction, Request, Response } from 'express';
import { nanoid } from 'nanoid';

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header('x-request-id');
  const id = incoming && incoming.trim().length > 0 ? incoming : nanoid(10);
  req.requestId = id;
  res.setHeader('x-request-id', id);
  next();
}
