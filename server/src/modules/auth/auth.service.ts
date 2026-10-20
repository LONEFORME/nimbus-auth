import bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
import { config } from '../../config';
import { ConflictError, NotFoundError, UnauthorizedError } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import { createRefreshToken, hashToken, signAccessToken } from '../../lib/tokens';
import { toUserDto, type UserDto } from '../users/user.dto';
import type { ChangePasswordInput, LoginInput, RegisterInput } from './auth.schemas';

export type SessionResult = {
  user: UserDto;
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
};

/** 颁发一对新令牌：access 走响应体，refresh 落库（仅存哈希） */
async function issueSession(user: User): Promise<SessionResult> {
  const { token, tokenHash, expiresAt } = createRefreshToken();

  await prisma.refreshToken.create({
    data: { tokenHash, userId: user.id, expiresAt },
  });

  return {
    user: toUserDto(user),
    accessToken: signAccessToken(user),
    refreshToken: token,
    refreshExpiresAt: expiresAt,
  };
}

export async function register(input: RegisterInput): Promise<SessionResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ConflictError('该邮箱已被注册');
  }

  const passwordHash = await bcrypt.hash(input.password, config.bcryptRounds);
  const user = await prisma.user.create({
    data: { email: input.email, name: input.name, passwordHash },
  });

  return issueSession(user);
}

export async function login(input: LoginInput): Promise<SessionResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new UnauthorizedError('邮箱或密码错误');
  }

  const matched = await bcrypt.compare(input.password, user.passwordHash);
  if (!matched) {
    throw new UnauthorizedError('邮箱或密码错误');
  }

  return issueSession(user);
}

/** 刷新令牌轮换：旧令牌立即吊销，成功换发新的一对 */
export async function refreshSession(rawToken: string | undefined): Promise<SessionResult> {
  if (!rawToken) {
    throw new UnauthorizedError('缺少刷新令牌');
  }

  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { user: true },
  });

  const isUsable =
    record !== null && record.revokedAt === null && record.expiresAt.getTime() > Date.now();

  if (!record || !isUsable) {
    // 命中已吊销令牌说明可能被重放，直接把该用户所有会话踢下线
    if (record) {
      await prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    throw new UnauthorizedError('刷新令牌无效或已过期，请重新登录');
  }

  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });

  return issueSession(record.user);
}

export async function logout(rawToken: string | undefined): Promise<void> {
  if (!rawToken) return;

  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(rawToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getProfile(userId: string): Promise<UserDto> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError('用户不存在');
  }
  return toUserDto(user);
}

export async function changePassword(
  userId: string,
  input: ChangePasswordInput
): Promise<SessionResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError('用户不存在');
  }

  const matched = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!matched) {
    throw new UnauthorizedError('当前密码不正确');
  }

  const passwordHash = await bcrypt.hash(input.newPassword, config.bcryptRounds);
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  // 改密后所有旧会话失效，再发一个新会话保持当前设备登录
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  return issueSession(updated);
}

/** 清理过期/已吊销的刷新令牌，可由定时任务调用 */
export async function pruneRefreshTokens(): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { not: null } }],
    },
  });
  return result.count;
}
