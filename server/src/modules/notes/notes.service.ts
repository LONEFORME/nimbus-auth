import type { Note } from '@prisma/client';
import { NotFoundError } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import type { CreateNoteInput, UpdateNoteInput } from './notes.schemas';

export type NoteDto = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

function toNoteDto(note: Note): NoteDto {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

export async function listNotes(userId: string): Promise<NoteDto[]> {
  const rows = await prisma.note.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return rows.map(toNoteDto);
}

export async function createNote(userId: string, input: CreateNoteInput): Promise<NoteDto> {
  const note = await prisma.note.create({
    data: { title: input.title, content: input.content, userId },
  });
  return toNoteDto(note);
}

/** 所有权校验与更新合并为一次条件查询，避免越权读写 */
async function findOwnedNote(userId: string, id: string): Promise<Note> {
  const note = await prisma.note.findFirst({ where: { id, userId } });
  if (!note) {
    throw new NotFoundError('笔记不存在或无权访问');
  }
  return note;
}

export async function updateNote(
  userId: string,
  id: string,
  input: UpdateNoteInput
): Promise<NoteDto> {
  await findOwnedNote(userId, id);
  const note = await prisma.note.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
    },
  });
  return toNoteDto(note);
}

export async function deleteNote(userId: string, id: string): Promise<void> {
  await findOwnedNote(userId, id);
  await prisma.note.delete({ where: { id } });
}
