import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { toUserDto, type UserDto } from './user.dto';

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(100).optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

export type PaginatedUsers = {
  items: UserDto[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export async function listUsers(query: ListUsersQuery): Promise<PaginatedUsers> {
  const { page, pageSize, search } = query;

  // 过滤下推到 SQL，避免全表捞出后在应用层筛
  const where =
    search && search.length > 0
      ? {
          OR: [{ email: { contains: search } }, { name: { contains: search } }],
        }
      : {};

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items: rows.map(toUserDto),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
