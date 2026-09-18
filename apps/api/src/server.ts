import express, { type Express } from 'express';
import { applyMiddleware } from './middleware';
import { createErrorHandler } from './errors';
import { createRoutes } from './routes';
import { createHealthRouter } from './health';
import type { AppContainer } from './container';

export function createServer(container: AppContainer): Express {
  const app: Express = express();

  applyMiddleware(app);
  app.use(createHealthRouter(container.database));
  app.use('/api', createRoutes(container));
  app.use(createErrorHandler(container.logger));

  return app;
}
