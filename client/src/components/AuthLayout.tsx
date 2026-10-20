import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 15.5A4.5 4.5 0 0 1 8.5 11a5.5 5.5 0 0 1 10.7 1.4A3.5 3.5 0 0 1 18.5 19H6.5A2.5 2.5 0 0 1 4 16.5Z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="text-lg font-semibold tracking-tight text-slate-900">Nimbus</span>
      </div>
    </div>
  );
}

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-slate-900 px-14 py-16 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl"
          aria-hidden
        />

        <div className="relative">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 15.5A4.5 4.5 0 0 1 8.5 11a5.5 5.5 0 0 1 10.7 1.4A3.5 3.5 0 0 1 18.5 19H6.5A2.5 2.5 0 0 1 4 16.5Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-lg font-semibold tracking-tight">Nimbus</span>
          </div>

          <h2 className="mt-20 max-w-md text-4xl font-semibold leading-tight tracking-tight">
            一套能直接跑起来的
            <span className="bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">
              {' '}
              全栈认证底座
            </span>
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-400">
            前端 React + 后端 Express + Prisma/SQLite。注册、登录、令牌轮换、RBAC 与受保护资源全部打通。
          </p>

          <ul className="mt-12 space-y-4 text-sm text-slate-300">
            {[
              'access token 仅存内存，XSS 也拿不到长效凭证',
              'refresh token 走 httpOnly Cookie，每次刷新即轮换',
              '后端边界校验 + 类型化错误 + request id 全链路日志',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" fill="currentColor">
                  <path d="M8.5 13.2 5.3 10l-1.1 1.1 4.3 4.3 7.3-7.3-1.1-1.1z" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-500">
          © {new Date().getFullYear()} Nimbus Starter · 本地即可运行
        </p>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 text-sm text-slate-500">{footer}</div>
        </div>
      </main>
    </div>
  );
}

export function AuthSwitchLink({ to, label, action }: { to: string; label: string; action: string }) {
  return (
    <span>
      {label}{' '}
      <Link to={to} className="font-medium text-indigo-600 hover:text-indigo-700">
        {action}
      </Link>
    </span>
  );
}
