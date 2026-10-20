import { apiFetch } from './client';
import type { Session, User } from './types';

export type RegisterInput = { email: string; name: string; password: string };
export type LoginInput = { email: string; password: string };
export type ChangePasswordInput = { currentPassword: string; newPassword: string };

export const authApi = {
  register: (input: RegisterInput) =>
    apiFetch<Session>('/auth/register', { method: 'POST', body: input, auth: false }),

  login: (input: LoginInput) =>
    apiFetch<Session>('/auth/login', { method: 'POST', body: input, auth: false }),

  logout: () => apiFetch<void>('/auth/logout', { method: 'POST', auth: false }),

  me: () => apiFetch<{ user: User }>('/auth/me'),

  changePassword: (input: ChangePasswordInput) =>
    apiFetch<Session>('/auth/password', { method: 'PATCH', body: input }),
};
