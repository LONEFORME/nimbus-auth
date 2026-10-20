import type { Request, Response } from 'express';
import { config } from '../../config';
import { getAuth } from '../../lib/request-auth';
import {
  REFRESH_COOKIE_NAME,
  clearRefreshCookieOptions,
  refreshCookieOptions,
} from '../../lib/tokens';
import * as authService from './auth.service';

function sendSession(res: Response, session: authService.SessionResult, status = 200): void {
  // 刷新令牌只走 httpOnly Cookie，绝不进响应体，避免被 JS 读取
  res.cookie(
    REFRESH_COOKIE_NAME,
    session.refreshToken,
    refreshCookieOptions(session.refreshExpiresAt)
  );
  res.status(status).json({
    data: {
      user: session.user,
      accessToken: session.accessToken,
      accessTokenExpiresIn: config.jwt.accessTtlMinutes * 60,
    },
  });
}

export async function register(req: Request, res: Response): Promise<void> {
  const session = await authService.register(req.body);
  sendSession(res, session, 201);
}

export async function login(req: Request, res: Response): Promise<void> {
  const session = await authService.login(req.body);
  sendSession(res, session);
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const raw = (req.cookies as Record<string, string | undefined>)[REFRESH_COOKIE_NAME];
  const session = await authService.refreshSession(raw);
  sendSession(res, session);
}

export async function logout(req: Request, res: Response): Promise<void> {
  const raw = (req.cookies as Record<string, string | undefined>)[REFRESH_COOKIE_NAME];
  await authService.logout(raw);
  res.clearCookie(REFRESH_COOKIE_NAME, clearRefreshCookieOptions());
  res.status(204).send();
}

export async function me(req: Request, res: Response): Promise<void> {
  const { userId } = getAuth(req);
  const user = await authService.getProfile(userId);
  res.json({ data: { user } });
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  const { userId } = getAuth(req);
  const session = await authService.changePassword(userId, req.body);
  sendSession(res, session);
}
