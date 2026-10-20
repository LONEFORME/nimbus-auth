import type { Request } from 'express';
import { UnauthorizedError } from '../lib/errors';

export function getAuth(req: Request) {
  if (!req.auth) throw new UnauthorizedError();
  return req.auth;
}
