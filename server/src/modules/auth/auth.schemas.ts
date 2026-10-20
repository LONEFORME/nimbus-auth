import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, '密码至少 8 位')
  .max(72, '密码最长 72 位')
  .regex(/[A-Za-z]/, '密码需包含字母')
  .regex(/\d/, '密码需包含数字');

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, '请输入邮箱')
  .max(254, '邮箱过长')
  .email('邮箱格式不正确');

export const registerSchema = z
  .object({
    email: emailSchema,
    name: z.string().trim().min(2, '昵称至少 2 个字符').max(32, '昵称最长 32 个字符'),
    password: passwordSchema,
  })
  .strict();

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, '请输入密码').max(72),
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, '请输入当前密码').max(72),
    newPassword: passwordSchema,
  })
  .strict()
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: '新密码不能与当前密码相同',
    path: ['newPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
