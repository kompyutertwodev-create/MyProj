import { Router } from 'express';
import {
  createNotificationRouter,
  type NotificationRouterDependencies,
} from './http/controllers/NotificationController.js';

export type { NotificationRouterDependencies };

export { createNotificationRouter } from './http/controllers/NotificationController.js';
