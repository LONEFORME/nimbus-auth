import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-5xl font-semibold tracking-tight text-slate-300">404</p>
      <h1 className="text-lg font-medium text-slate-800">页面不存在</h1>
      <p className="text-sm text-slate-500">你访问的地址可能已经被移动或删除。</p>
      <Link
        to="/app"
        className="mt-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
      >
        返回工作台
      </Link>
    </div>
  );
}
