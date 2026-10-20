import type { NextFunction, Request, RequestHandler, Response } from 'express';

/** 统一包装 async 路由，避免每个 handler 手写 try/catch */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
