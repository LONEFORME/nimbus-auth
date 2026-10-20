import type { RequestHandler } from 'express';
import { UnauthorizedError } from '../lib/errors';
import { verifyAccessToken } from '../lib/tokens';
import { asyncHandler } from './async-handler';

export const requireAuth: RequestHandler = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new UnauthorizedError('缺少访问令牌');
  }

  try {
    const payload = verifyAccessToken(header.slice(7).trim());
    req.auth = { userId: payload.sub, email: payload.email, role: payload.role };
  } catch {
    // 客户端收到 401 后会用 Cookie 中的刷新令牌换新 token，再由 apiFetch 重试一次
    throw new UnauthorizedError('访问令牌无效或已过期');
  }

  next();
});
