import type { RequestHandler } from 'express';
import type { z } from 'zod';

/** 在边界处校验 body，并把解析后的干净数据写回 req.body */
export function validateBody<T extends z.ZodTypeAny>(schema: T): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(result.error);
      return;
    }
    req.body = result.data;
    next();
  };
}
