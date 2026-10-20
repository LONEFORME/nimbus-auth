import bcrypt from 'bcryptjs';
import { config } from '../config';
import { logger } from '../lib/logger';
import { prisma } from '../lib/prisma';

const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com').toLowerCase();
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!';
const ADMIN_NAME = process.env.SEED_ADMIN_NAME ?? '管理员';

const DEMO_EMAIL = 'demo@example.com';
const DEMO_PASSWORD = 'Demo1234';

async function upsertUser(email: string, name: string, password: string, role: string) {
  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
  return prisma.user.upsert({
    where: { email },
    update: { name, role },
    create: { email, name, role, passwordHash },
  });
}

async function main(): Promise<void> {
  const admin = await upsertUser(ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD, 'ADMIN');
  const demo = await upsertUser(DEMO_EMAIL, '示例用户', DEMO_PASSWORD, 'USER');

  const existingNotes = await prisma.note.count({ where: { userId: demo.id } });
  if (existingNotes === 0) {
    await prisma.note.createMany({
      data: [
        { userId: demo.id, title: '欢迎使用 Nimbus', content: '这是一条种子笔记，可以直接编辑或删除。' },
        { userId: demo.id, title: '认证是怎么做的', content: 'access token 存内存，refresh token 走 httpOnly Cookie 并轮换。' },
      ],
    });
  }

  logger.info(
    {
      admin: { email: admin.email, password: ADMIN_PASSWORD },
      demo: { email: demo.email, password: DEMO_PASSWORD },
    },
    '种子数据写入完成'
  );
  console.log('\n  种子数据写入完成：');
  console.log(`  管理员  ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`  普通用户 ${DEMO_EMAIL} / ${DEMO_PASSWORD}\n`);
}

main()
  .catch((error) => {
    logger.error({ err: error }, '种子数据写入失败');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
