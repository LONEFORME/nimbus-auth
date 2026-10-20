import { Router } from 'express';
import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/async-handler';
import { requireAuth } from '../../middleware/require-auth';
import { requireRole } from '../../middleware/require-role';
import { listUsers, listUsersQuerySchema } from './users.service';

export const usersRouter = Router();

usersRouter.get(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const query = listUsersQuerySchema.parse(req.query);
    const result = await listUsers(query);
    res.json({ data: result });
  })
);
