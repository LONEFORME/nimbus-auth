import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../api/auth';
import type { LoginInput, RegisterInput } from '../api/auth';
import {
  onSessionExpired,
  refreshSession,
  setAccessToken,
  getAccessToken,
} from '../api/client';
import type { Session, User } from '../api/types';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  applySession: (session: Session) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);

  const applySession = useCallback((session: Session) => {
    setAccessToken(session.accessToken);
    setUser(session.user);
    setStatus('authenticated');
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setStatus('anonymous');
  }, []);

  // 冷启动：用 httpOnly Cookie 换 access token，再拉用户资料
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const token = await refreshSession();
      if (!token) {
        if (!cancelled) clearSession();
        return;
      }
      try {
        const { user: profile } = await authApi.me();
        if (!cancelled) {
          setUser(profile);
          setStatus('authenticated');
        }
      } catch {
        if (!cancelled) clearSession();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  // 刷新令牌也失效时，全局兜底回到未登录态
  useEffect(
    () =>
      onSessionExpired(() => {
        setAccessToken(null);
        setUser(null);
        setStatus('anonymous');
      }),
    []
  );

  const login = useCallback(
    async (input: LoginInput) => {
      const session = await authApi.login(input);
      applySession(session);
    },
    [applySession]
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const session = await authApi.register(input);
      applySession(session);
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, register, logout, applySession }),
    [status, user, login, register, logout, applySession]
  );

  // 防御：token 已失效但状态没同步（例如多标签页互相踢下线）
  useEffect(() => {
    if (status === 'authenticated' && !getAccessToken()) {
      clearSession();
    }
  }, [status, clearSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth 必须在 AuthProvider 内使用');
  return ctx;
}
