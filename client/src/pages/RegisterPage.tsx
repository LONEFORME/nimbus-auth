import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { errorMessage, toFieldErrors } from '../api/client';
import { useAuth } from '../auth/AuthProvider';
import { AuthLayout, AuthSwitchLink } from '../components/AuthLayout';
import { Alert, Button, InputField } from '../components/ui';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const localErrors: Record<string, string> = {};
    if (password !== confirm) localErrors.confirm = '两次输入的密码不一致';
    setFieldErrors(localErrors);
    if (Object.keys(localErrors).length > 0) return;

    setSubmitting(true);
    try {
      await register({ name, email, password });
      navigate('/app', { replace: true });
    } catch (error) {
      setFormError(errorMessage(error, '注册失败，请稍后重试'));
      setFieldErrors(toFieldErrors(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="创建账号"
      subtitle="注册后立即可用，无需邮箱验证。"
      footer={<AuthSwitchLink to="/login" label="已经有账号？" action="直接登录" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {formError && <Alert>{formError}</Alert>}

        <InputField
          label="昵称"
          name="name"
          placeholder="怎么称呼你"
          autoComplete="nickname"
          value={name}
          error={fieldErrors.name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <InputField
          label="邮箱"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          error={fieldErrors.email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <InputField
          label="密码"
          name="password"
          type="password"
          placeholder="至少 8 位，含字母和数字"
          autoComplete="new-password"
          value={password}
          error={fieldErrors.password}
          hint="至少 8 位，需同时包含字母与数字"
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <InputField
          label="确认密码"
          name="confirm"
          type="password"
          placeholder="再输入一次"
          autoComplete="new-password"
          value={confirm}
          error={fieldErrors.confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />

        <Button type="submit" loading={submitting} className="w-full">
          创建账号
        </Button>
      </form>
    </AuthLayout>
  );
}
