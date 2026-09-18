import type { HealthCheck } from './HealthCheck.js';
import type { HealthCheckResult } from './HealthCheckResult.js';
export class HealthRegistry {
  private readonly checks = new Map<string, HealthCheck>();
  register(name: string, check: HealthCheck): this {
    this.checks.set(name, check);
    return this;
  }
  unregister(name: string): boolean {
    return this.checks.delete(name);
  }
  async run(name?: string): Promise<HealthCheckResult[]> {
    const selected = name ? [[name, this.checks.get(name)] as const] : [...this.checks.entries()];
    return Promise.all(
      selected.map(async ([n, check]): Promise<HealthCheckResult> => {
        const started = Date.now();
        if (!check)
          return { name: n, status: 'unhealthy', durationMs: 0, message: 'Check not found' };
        try {
          const result = await check();
          if (typeof result === 'object' && result !== null && 'status' in result) {
            const checked = result as HealthCheckResult;
            return { ...checked, name: n, durationMs: checked.durationMs ?? Date.now() - started };
          }
          return {
            name: n,
            status: 'healthy',
            durationMs: Date.now() - started,
            details: result as Record<string, unknown>,
          };
        } catch (e) {
          return {
            name: n,
            status: 'unhealthy',
            durationMs: Date.now() - started,
            message: e instanceof Error ? e.message : String(e),
          };
        }
      })
    );
  }
}
