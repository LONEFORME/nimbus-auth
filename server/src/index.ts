import { createApp } from './app';
import { config } from './config';
import { logger } from './lib/logger';
import { disconnectPrisma } from './lib/prisma';

const app = createApp();
const server = app.listen(config.port, () => {
  logger.info(
    { port: config.port, nodeEnv: config.env, clientOrigin: config.clientOrigin },
    'API 服务已启动'
  );
});

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, '收到退出信号，开始优雅关闭');

  const forceTimer = setTimeout(() => {
    logger.error('优雅关闭超时，强制退出');
    process.exit(1);
  }, 10_000);
  forceTimer.unref();

  server.close(async () => {
    try {
      await disconnectPrisma();
      logger.info('连接已释放，进程退出');
      process.exit(0);
    } catch (error) {
      logger.error({ err: error }, '关闭数据库连接失败');
      process.exit(1);
    }
  });
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, '未处理的 Promise 拒绝');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, '未捕获异常，进程退出');
  process.exit(1);
});
