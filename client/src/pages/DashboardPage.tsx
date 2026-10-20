import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { authApi } from '../api/auth';
import { errorMessage, toFieldErrors } from '../api/client';
import { notesApi } from '../api/notes';
import type { Note } from '../api/types';
import { useAuth } from '../auth/AuthProvider';
import { Alert, Badge, Button, Card, InputField, Spinner, TextareaField } from '../components/ui';
import { formatDateTime, timeAgo } from '../utils/format';

export default function DashboardPage() {
  const { user, applySession } = useAuth();

  const [notes, setNotes] = useState<Note[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordDone, setPasswordDone] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);

  const loadNotes = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const result = await notesApi.list();
      setNotes(result.notes);
    } catch (error) {
      setListError(errorMessage(error, '笔记加载失败'));
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  function resetForm() {
    setTitle('');
    setContent('');
    setEditingId(null);
  }

  async function handleSaveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNoteError(null);
    setSaving(true);
    try {
      if (editingId) {
        const { note } = await notesApi.update(editingId, { title, content });
        setNotes((prev) => prev.map((item) => (item.id === note.id ? note : item)));
      } else {
        const { note } = await notesApi.create({ title, content });
        setNotes((prev) => [note, ...prev]);
      }
      resetForm();
    } catch (error) {
      setNoteError(errorMessage(error, '保存失败'));
    } finally {
      setSaving(false);
    }
  }

  function startEdit(note: Note) {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setNoteError(null);
  }

  async function handleDelete(id: string) {
    if (!window.confirm('确定删除这条笔记？')) return;
    setDeletingId(id);
    setNoteError(null);
    try {
      await notesApi.remove(id);
      setNotes((prev) => prev.filter((item) => item.id !== id));
      if (editingId === id) resetForm();
    } catch (error) {
      setNoteError(errorMessage(error, '删除失败'));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordDone(null);
    setChanging(true);
    try {
      const session = await authApi.changePassword({ currentPassword, newPassword });
      applySession(session);
      setCurrentPassword('');
      setNewPassword('');
      setPasswordDone('密码已更新，其它设备上的会话已全部失效');
    } catch (error) {
      setPasswordError(errorMessage(error, '修改密码失败'));
      const fields = toFieldErrors(error);
      if (fields.currentPassword) setPasswordError(fields.currentPassword);
      if (fields.newPassword) setPasswordError(fields.newPassword);
    } finally {
      setChanging(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          你好，{user?.name}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          这里的数据全部经由需要认证的 API 读写，未登录无法访问。
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="space-y-4">
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                {editingId ? '编辑笔记' : '新建笔记'}
              </h2>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  取消编辑
                </button>
              )}
            </div>

            <form onSubmit={handleSaveNote} className="mt-4 space-y-3">
              {noteError && <Alert>{noteError}</Alert>}
              <InputField
                label="标题"
                name="title"
                placeholder="给这条笔记起个名字"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                required
              />
              <TextareaField
                label="内容"
                name="content"
                placeholder="写点什么…"
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={5000}
              />
              <div className="flex justify-end">
                <Button type="submit" loading={saving}>
                  {editingId ? '保存修改' : '添加笔记'}
                </Button>
              </div>
            </form>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">我的笔记</h2>
              <Badge>{notes.length} 条</Badge>
            </div>

            <div className="mt-4">
              {listLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
                  <Spinner className="h-4 w-4" /> 加载中…
                </div>
              ) : listError ? (
                <Alert>{listError}</Alert>
              ) : notes.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-400">
                  还没有笔记，用上面的表单添加第一条。
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {notes.map((note) => (
                    <li key={note.id} className="py-3.5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800">{note.title}</p>
                          {note.content && (
                            <p className="mt-1 line-clamp-2 text-sm text-slate-500">{note.content}</p>
                          )}
                          <p className="mt-1.5 text-xs text-slate-400">
                            {timeAgo(note.createdAt)} · {formatDateTime(note.updatedAt)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button variant="ghost" className="px-2.5 py-1.5 text-xs" onClick={() => startEdit(note)}>
                            编辑
                          </Button>
                          <Button
                            variant="ghost"
                            className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
                            loading={deletingId === note.id}
                            onClick={() => void handleDelete(note.id)}
                          >
                            删除
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </section>

        <aside className="space-y-6">
          <Card>
            <h2 className="text-base font-semibold text-slate-900">账号信息</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">昵称</dt>
                <dd className="font-medium text-slate-800">{user?.name}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">邮箱</dt>
                <dd className="truncate font-medium text-slate-800">{user?.email}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">角色</dt>
                <dd>
                  {user?.role === 'ADMIN' ? (
                    <Badge tone="indigo">管理员</Badge>
                  ) : (
                    <Badge tone="emerald">普通用户</Badge>
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">注册时间</dt>
                <dd className="text-slate-700">{user ? formatDateTime(user.createdAt) : '—'}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 className="text-base font-semibold text-slate-900">修改密码</h2>
            <form onSubmit={handleChangePassword} className="mt-4 space-y-3">
              {passwordError && <Alert>{passwordError}</Alert>}
              {passwordDone && <Alert tone="success">{passwordDone}</Alert>}
              <InputField
                label="当前密码"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <InputField
                label="新密码"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                hint="至少 8 位，含字母和数字"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Button type="submit" variant="secondary" loading={changing} className="w-full">
                更新密码
              </Button>
            </form>
          </Card>
        </aside>
      </div>
    </div>
  );
}
