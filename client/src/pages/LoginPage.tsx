import { useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { errorMessage, toFieldErrors } from '../api/client';
import { useAuth } from '../auth/AuthProvider';
import { AuthLayout, AuthSwitchLink } from '../components/AuthLayout';
import { Alert, Button, InputField } from '../components/ui';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/app';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSubmitting(true);

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (error) {
      setFormError(errorMessage(error, '登录失败，请稍后重试'));
      setFieldErrors(toFieldErrors(error));
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemo() {
    setEmail('demo@example.com');
    setPassword('Demo1234');
    setFormError(null);
  }

  return (
    <AuthLayout
      title="登录 Nimbus"
      subtitle="使用邮箱和密码继续。"
      footer={<AuthSwitchLink to="/register" label="还没有账号？" action="免费注册" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {formError && <Alert>{formError}</Alert>}

        <InputField
          label="邮箱"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          error={fieldErrors.email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <InputField
          label="密码"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          error={fieldErrors.password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button type="submit" loading={submitting} className="w-full">
          登录
        </Button>

        <button
          type="button"
          onClick={fillDemo}
          className="w-full text-center text-xs text-slate-400 transition hover:text-indigo-600"
        >
          填入演示账号（demo@example.com / Demo1234）
        </button>
      </form>
    </AuthLayout>
  );
}
