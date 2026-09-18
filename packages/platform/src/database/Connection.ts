export interface Connection {
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  getPool(): unknown;
}

/** Small dependency-free connection useful for tests and local adapters. */
export class MemoryConnection implements Connection {
  private readonly handlers = new Map<string, (params: unknown[]) => unknown[]>();
  register<T>(sql: string, handler: (params: unknown[]) => T[]): void {
    this.handlers.set(sql, handler);
  }
  async query<T>(query: string, params: unknown[] = []): Promise<T[]> {
    return (this.handlers.get(query)?.(params) ?? []) as T[];
  }
  getPool(): unknown {
    return this;
  }
}
