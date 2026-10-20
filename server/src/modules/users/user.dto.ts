import type { User } from '@prisma/client';
import { normalizeRole } from '../../lib/roles';
import type { UserRole } from '../../lib/roles';

export type UserDto = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

/** 出参白名单：passwordHash 永远不出现在响应里 */
export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: normalizeRole(user.role),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
