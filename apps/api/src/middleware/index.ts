import express, { type Express } from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';

import { requestId } from './request-id.js';
import { requestContext } from './request-context.js';
import { security } from './security.js';
import {
  globalRateLimit,
  globalSlowDown,
  authRateLimit,
  authSlowDown,
} from './rate-limit.js';

// ---- Re-exports -----------------------------------------------------------
// Kept so that consumers can import everything from a single module.

export { requestId, REQUEST_ID_HEADER } from './request-id.js';
export { requestContext } from './request-context.js';
export { security, getAllowedOrigins } from './security.js';
export {
  globalRateLimit,
  globalSlowDown,
  authRateLimit,
  authSlowDown,
  RATE_LIMIT_RESPONSE,
  SLOW_DOWN_RESPONSE,
} from './rate-limit.js';

/**
 * Apply the global middleware chain to the Express app.
 *
 * Order is load-bearing:
 *   0. `trust proxy`     -- required for req.ip behind a reverse proxy.
 *   1. `requestId`       -- must run before pino-http so that req.id exists.
 *   2. `pinoHttp`        -- structured request logging using req.id.
 *   3. `requestContext`  -- installs AsyncLocalStorage for the request.
 *   4. `security`        -- helmet headers + CORS, short-circuits preflight.
 *   5. `compression`     -- response compression.
 *   6. `cookieParser`    -- parse cookies before auth reads them.
 *   7. `express.json`    -- body parsing, needed by authKey for rate limit.
 *   8. `express.urlencoded` -- form bodies.
 *   9. `globalSlowDown`  -- soft back-pressure for abusive clients.
 *  10. `globalRateLimit` -- hard limit per IP.
 */
export function applyMiddleware(app: Express): void {
  // The API is served behind Replit's forwarding proxy. Trust the first
  // proxy hop so rate limiting can use the original client address.
  app.set('trust proxy', 1);

  // 1. Request id -- sets req.id and echoes X-Request-ID.
  app.use(requestId());

  // 2. Structured logging. Uses req.id set above.
  app.use(
    pinoHttp({
      redact: [
        'req.headers.authorization',
        'req.headers.cookie',
        "res.headers['set-cookie']",
      ],
      serializers: {
        req(req) {
          return {
            id: req.id,
            method: req.method,
            url: req.url?.split('?')[0],
          };
        },
        res(res) {
          return { statusCode: res.statusCode };
        },
      },
    })
  );

  // 3. AsyncLocalStorage for correlationId / actorId / tenantId.
  app.use(requestContext());

  // 4. Security headers + CORS. Runs before body parsing so that
  //    preflight OPTIONS requests never reach the body parser.
  app.use(...security());

  // 5. Response compression.
  app.use(compression());

  // 6. Cookies -- needed before auth middleware reads them.
  app.use(cookieParser());

  // 7. Body parsing. Must run before rate limiting because the auth
  //    limiter keys on req.body.email when present.
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 8. Global soft back-pressure.
  app.use(globalSlowDown());

  // 9. Global hard rate limit.
  app.use(globalRateLimit());
}

/**
 * Apply the strict auth middleware to a specific router prefix.
 *
 * Mounted by `routes.ts` on the `/api/v1/auth` subtree so that login,
 * register, refresh and OAuth attempts share a small quota (5/min) and
 * incur a 1 s delay after the third attempt.
 *
 * @param app  Express application instance.
 * @param path Prefix to protect (default `/api/v1/auth`).
 */
export function applyAuthMiddleware(app: Express, path = '/api/v1/auth'): void {
  app.use(path, authSlowDown(), authRateLimit());
}