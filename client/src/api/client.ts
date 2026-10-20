import type { Session } from './types';

export type FieldError = { path: string; message: string };

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: FieldError[];

  constructor(status: number, code: string, message: string, details?: FieldError[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

// access token 只放内存：刷新页面靠 httpOnly Cookie 换新，XSS 拿不到长效凭证
let accessToken: string | null = null;
let refreshInFlight: Promise<string | null> | null = null;

const expiryListeners = new Set<() => void>();

export function onSessionExpired(listener: () => void): () => void {
  expiryListeners.add(listener);
  return () => {
    expiryListeners.delete(listener);
  };
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** 单飞刷新：并发 401 只触发一次 /auth/refresh */
export function refreshSession(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) return null;
        const payload = (await readJson(res)) as { data?: Session } | null;
        const token = payload?.data?.accessToken ?? null;
        setAccessToken(token);
        return token;
      } catch {
        return null;
      }
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** 是否附带 access token，认证接口本身设为 false */
  auth?: boolean;
  signal?: AbortSignal;
};

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
  allowRetry = true
): Promise<T> {
  const { method = 'GET', body, auth = true, signal } = options;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      credentials: 'include',
      signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', '网络连接失败，请检查后端服务是否已启动');
  }

  if (res.status === 401 && auth && allowRetry) {
    const renewed = await refreshSession();
    if (renewed) {
      return apiFetch<T>(path, options, false);
    }
    setAccessToken(null);
    expiryListeners.forEach((listener) => listener());
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const payload = await readJson(res);

  if (!res.ok) {
    const error = (payload as { error?: { code?: string; message?: string; details?: FieldError[] } } | null)
      ?.error;
    throw new ApiError(
      res.status,
      error?.code ?? 'UNKNOWN_ERROR',
      error?.message ?? `请求失败（HTTP ${res.status}）`,
      error?.details
    );
  }

  return (payload as { data: T } | null)?.data as T;
}

/** 把后端字段级错误聚合成 { 字段: 提示 }，直接喂给表单 */
export function toFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || !error.details) return {};
  return error.details.reduce<Record<string, string>>((acc, item) => {
    if (!acc[item.path]) acc[item.path] = item.message;
    return acc;
  }, {});
}

export function errorMessage(error: unknown, fallback = '操作失败，请稍后重试'): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
