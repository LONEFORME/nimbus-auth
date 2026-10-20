import crypto from 'node:crypto';
import type { RequestHandler } from 'express';

/** 为每个请求生成 request id，贯穿日志与错误响应，便于定位问题 */
export const requestContext: RequestHandler = (req, res, next) => {
  const incoming = req.headers['x-request-id'];
  const requestId =
    typeof incoming === 'string' && incoming.length > 0 && incoming.length <= 128
      ? incoming
      : crypto.randomUUID();

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
};
