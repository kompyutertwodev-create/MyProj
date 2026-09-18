import type { Transaction } from '../Transaction.js';
export interface TransactionalDatabase {
  transaction<T>(fn: (tx: unknown) => Promise<T>): Promise<T>;
}
export class DrizzleTransaction implements Transaction {
  private active = false;
  constructor(private readonly db: TransactionalDatabase) {}
  async begin(): Promise<void> {
    this.active = true;
  }
  async commit(): Promise<void> {
    this.active = false;
  }
  async rollback(): Promise<void> {
    this.active = false;
  }
  async withTransaction<T>(fn: () => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => {
      void tx;
      this.active = true;
      try {
        return await fn();
      } finally {
        this.active = false;
      }
    });
  }
}
