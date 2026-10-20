import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../../middleware/async-handler';
import { requireAuth } from '../../middleware/require-auth';
import { validateBody } from '../../middleware/validate';
import * as authController from './auth.controller';
import { changePasswordSchema, loginSchema, registerSchema } from './auth.schemas';

const WINDOW_MS = 15 * 60 * 1000;

function limiter(limit: number, message: string, skipSuccess = false) {
  return rateLimit({
    windowMs: WINDOW_MS,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: skipSuccess,
    message: { error: { code: 'TOO_MANY_REQUESTS', message } },
  });
}

export const authRouter = Router();

authRouter.post(
  '/register',
  limiter(20, '注册过于频繁，请 15 分钟后再试'),
  validateBody(registerSchema),
  asyncHandler(authController.register)
);

authRouter.post(
  '/login',
  limiter(10, '登录尝试过于频繁，请 15 分钟后再试', true),
  validateBody(loginSchema),
  asyncHandler(authController.login)
);

authRouter.post('/refresh', limiter(120, '刷新过于频繁，请稍后再试'), asyncHandler(authController.refresh));

authRouter.post('/logout', asyncHandler(authController.logout));

authRouter.get('/me', requireAuth, asyncHandler(authController.me));

authRouter.patch(
  '/password',
  requireAuth,
  validateBody(changePasswordSchema),
  asyncHandler(authController.changePassword)
);
