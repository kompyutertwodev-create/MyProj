/**
 * Unit of Work — coordinates transaction boundaries across multiple repositories.
 * The concrete adapter lives in packages/platform (DrizzleUnitOfWork, etc.).
 */
export interface UnitOfWork {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  /** Execute fn inside a single atomic transaction. */
  withTransaction<T>(fn: () => Promise<T>): Promise<T>;
}
