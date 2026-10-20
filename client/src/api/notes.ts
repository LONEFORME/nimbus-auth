import { apiFetch } from './client';
import type { Note } from './types';

export const notesApi = {
  list: () => apiFetch<{ notes: Note[] }>('/notes'),

  create: (input: { title: string; content?: string }) =>
    apiFetch<{ note: Note }>('/notes', { method: 'POST', body: input }),

  update: (id: string, input: { title?: string; content?: string }) =>
    apiFetch<{ note: Note }>(`/notes/${id}`, { method: 'PATCH', body: input }),

  remove: (id: string) => apiFetch<void>(`/notes/${id}`, { method: 'DELETE' }),
};
