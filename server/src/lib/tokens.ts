import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { CookieOptions } from 'express';
import { config } from '../config';
import type { UserRole } from './roles';

export const REFRESH_COOKIE_NAME = 'nimbus_rt';
export const REFRESH_COOKIE_PATH = '/api/auth';

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: UserRole;
  typ: 'access';
};

type TokenUser = { id: string; email: string; role: string };

export function signAccessToken(user: TokenUser): string {
  const payload: AccessTokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role === 'ADMIN' ? 'ADMIN' : 'USER',
    typ: 'access',
  };
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessTtlMinutes * 60,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, config.jwt.accessSecret);
  if (typeof decoded === 'string' || decoded.typ !== 'access') {
    throw new Error('invalid access token');
  }
  return decoded as AccessTokenPayload;
}

/** 刷新令牌明文只下发一次，库里仅存 SHA-256 摘要 */
export function createRefreshToken(): { token: string; tokenHash: string; expiresAt: Date } {
  const token = crypto.randomBytes(48).toString('base64url');
  const expiresAt = new Date(Date.now() + config.refresh.ttlDays * 24 * 60 * 60 * 1000);
  return { token, tokenHash: hashToken(token), expiresAt };
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function refreshCookieOptions(expiresAt: Date): CookieOptions {
  return {
    httpOnly: true,
    secure: config.isProd,
    sameSite: 'lax',
    path: REFRESH_COOKIE_PATH,
    expires: expiresAt,
  };
}

export function clearRefreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: config.isProd,
    sameSite: 'lax',
    path: REFRESH_COOKIE_PATH,
  };
}
