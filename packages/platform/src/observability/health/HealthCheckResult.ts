import type { HealthStatus } from './HealthStatus.js';
export interface HealthCheckResult {
  name: string;
  status: HealthStatus;
  durationMs: number;
  message?: string;
  details?: Record<string, unknown>;
}
