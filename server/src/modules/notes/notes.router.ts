import { Router } from 'express';
import type { Request, Response } from 'express';
import { getAuth } from '../../lib/request-auth';
import { asyncHandler } from '../../middleware/async-handler';
import { requireAuth } from '../../middleware/require-auth';
import { validateBody } from '../../middleware/validate';
import { createNoteSchema, noteIdSchema, updateNoteSchema } from './notes.schemas';
import * as notesService from './notes.service';

export const notesRouter = Router();

notesRouter.use(requireAuth);

notesRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    const notes = await notesService.listNotes(userId);
    res.json({ data: { notes } });
  })
);

notesRouter.post(
  '/',
  validateBody(createNoteSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    const note = await notesService.createNote(userId, req.body);
    res.status(201).json({ data: { note } });
  })
);

notesRouter.patch(
  '/:id',
  validateBody(updateNoteSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    const { id } = noteIdSchema.parse(req.params);
    const note = await notesService.updateNote(userId, id, req.body);
    res.json({ data: { note } });
  })
);

notesRouter.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = getAuth(req);
    const { id } = noteIdSchema.parse(req.params);
    await notesService.deleteNote(userId, id);
    res.status(204).send();
  })
);
