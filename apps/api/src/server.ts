import express, { type Express } from 'express';
import { applyMiddleware, applyAuthMiddleware } from './middleware/index.js';
import { createErrorHandler } from './errors.js';
import { createRoutes } from './routes.js';
import { createHealthRouter } from './health.js';
import type { AppContainer } from './container';

/**
 * Compose the Express application.
 *
 * Middleware order (top to bottom):
 *   1. Global chain from `applyMiddleware` (requestId, logging, context,
 *      security, body parsing, rate limits).
 *   2. Auth-specific chain from `applyAuthMiddleware` (5/min + 1 s delay).
 *   3. Health check router (no auth, no rate limit).
 *   4. API routes.
 *   5. Error handler (must be last).
 */
export function createServer(container: AppContainer): Express {
  const app: Express = express();

  applyMiddleware(app);

  // Strict quota for authentication endpoints. Must be mounted before the
  // routes so that POST /api/v1/auth/login, /register, /refresh, and the
  // OAuth handshake all share the small per-IP+email bucket.
  applyAuthMiddleware(app);

  app.use(createHealthRouter(container.database));
  app.use('/api', createRoutes(container));
  app.use(createErrorHandler(container.logger));

  return app;
}