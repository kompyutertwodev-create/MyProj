import type { HealthCheckResult } from './HealthCheckResult.js';
export type HealthCheck = () =>
  | Promise<HealthCheckResult | Record<string, unknown>>
  | HealthCheckResult
  | Record<string, unknown>;
