import { apiFetch } from './client';
import type { PaginatedUsers } from './types';

export const usersApi = {
  list: (params: { page?: number; pageSize?: number; search?: string } = {}) => {
    const search = new URLSearchParams();
    if (params.page) search.set('page', String(params.page));
    if (params.pageSize) search.set('pageSize', String(params.pageSize));
    if (params.search) search.set('search', params.search);
    const qs = search.toString();
    return apiFetch<PaginatedUsers>(`/users${qs ? `?${qs}` : ''}`);
  },
};
