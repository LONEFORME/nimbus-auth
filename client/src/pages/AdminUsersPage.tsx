import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { errorMessage } from '../api/client';
import { usersApi } from '../api/users';
import type { PaginatedUsers } from '../api/types';
import { useAuth } from '../auth/AuthProvider';
import { Alert, Badge, Button, Card, InputField, Spinner } from '../components/ui';
import { formatDateTime } from '../utils/format';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [data, setData] = useState<PaginatedUsers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;

    let cancelled = false;
    setLoading(true);

    usersApi
      .list({ page, pageSize: 10, search: query || undefined })
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, '用户列表加载失败'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, query, isAdmin]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setQuery(searchInput.trim());
  }

  if (!isAdmin) {
    return (
      <Card>
        <Alert>该页面仅管理员可见。</Alert>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">用户管理</h1>
          <p className="mt-1 text-sm text-slate-500">
            受 RBAC 保护，仅 ADMIN 角色可访问该接口。
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex items-end gap-2">
          <InputField
            label="搜索"
            name="search"
            placeholder="邮箱或昵称"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-56"
          />
          <Button type="submit" variant="secondary">
            查询
          </Button>
        </form>
      </div>

      <Card className="p-0">
        {error ? (
          <div className="p-6">
            <Alert>{error}</Alert>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
            <Spinner className="h-4 w-4" /> 加载中…
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">用户</th>
                    <th className="px-6 py-3 font-medium">角色</th>
                    <th className="px-6 py-3 font-medium">注册时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600">
                            {item.name.slice(0, 1).toUpperCase()}
                          </span>
                          <div>
                            <p className="font-medium text-slate-800">{item.name}</p>
                            <p className="text-xs text-slate-500">{item.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        {item.role === 'ADMIN' ? (
                          <Badge tone="indigo">管理员</Badge>
                        ) : (
                          <Badge>普通用户</Badge>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600">{formatDateTime(item.createdAt)}</td>
                    </tr>
                  ))}
                  {data?.items.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                        没有匹配的用户
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3.5 text-sm text-slate-500">
              <span>
                共 {data?.total ?? 0} 位用户 · 第 {data?.page ?? 1} / {data?.totalPages ?? 1} 页
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="px-3 py-1.5 text-xs"
                  disabled={(data?.page ?? 1) <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  上一页
                </Button>
                <Button
                  variant="secondary"
                  className="px-3 py-1.5 text-xs"
                  disabled={(data?.page ?? 1) >= (data?.totalPages ?? 1)}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  下一页
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
