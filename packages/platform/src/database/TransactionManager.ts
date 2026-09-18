export interface TransactionManager {
  withTransaction<T>(fn: (tx: unknown) => Promise<T>): Promise<T>;
}
export class MemoryTransactionManager implements TransactionManager {
  constructor(private readonly transaction: unknown = undefined) {}
  async withTransaction<T>(fn: (tx: unknown) => Promise<T>): Promise<T> {
    return fn(this.transaction);
  }
}
