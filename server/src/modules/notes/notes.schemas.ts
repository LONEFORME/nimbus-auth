import { z } from 'zod';

export const createNoteSchema = z
  .object({
    title: z.string().trim().min(1, '请输入标题').max(120, '标题最长 120 个字符'),
    content: z.string().max(5000, '内容最长 5000 个字符').optional().default(''),
  })
  .strict();

export const updateNoteSchema = z
  .object({
    title: z.string().trim().min(1, '标题不能为空').max(120).optional(),
    content: z.string().max(5000).optional(),
  })
  .strict()
  .refine((data) => data.title !== undefined || data.content !== undefined, {
    message: '至少需要修改一个字段',
  });

export const noteIdSchema = z.object({
  id: z.string().min(1, '缺少笔记 ID').max(64),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
