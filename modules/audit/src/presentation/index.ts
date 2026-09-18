import { Router } from 'express';
import {
  createAuditRouter,
  type AuditRouterDependencies,
} from './http/controllers/AuditController.js';

export type { AuditRouterDependencies };

export { createAuditRouter } from './http/controllers/AuditController.js';
