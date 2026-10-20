import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

// 无论从 server/ 还是 dist/ 启动，都指向 server/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL 未配置'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET 至少 32 个字符'),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  CLIENT_ORIGIN: z.string().min(1).default('http://localhost:5173'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(8).max(15).default(11),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const detail = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  // 配置错误必须 fail fast，不能带病启动
  console.error(`[config] 环境变量校验失败 -> ${detail}`);
  process.exit(1);
}

const env = parsed.data;

export const config = {
  env: env.NODE_ENV,
  isProd: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  port: env.PORT,
  databaseUrl: env.DATABASE_URL,
  clientOrigin: env.CLIENT_ORIGIN,
  logLevel: env.LOG_LEVEL,
  bcryptRounds: env.BCRYPT_ROUNDS,
  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    accessTtlMinutes: env.ACCESS_TOKEN_TTL_MINUTES,
  },
  refresh: {
    ttlDays: env.REFRESH_TOKEN_TTL_DAYS,
  },
} as const;
