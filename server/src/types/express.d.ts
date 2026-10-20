import type { UserRole } from '../lib/roles';

export type AuthContext = {
  userId: string;
  email: string;
  role: UserRole;
};

declare global {
  namespace Express {
    interface Request {
      /** 请求级追踪 ID，写入响应头 x-request-id */
      requestId: string;
      /** 通过认证中间件注入的身份上下文 */
      auth?: AuthContext;
    }
  }
}

export {};
