export const ROLES = ['USER', 'ADMIN'] as const;
export type UserRole = (typeof ROLES)[number];

export function normalizeRole(value: string): UserRole {
  return value === 'ADMIN' ? 'ADMIN' : 'USER';
}
