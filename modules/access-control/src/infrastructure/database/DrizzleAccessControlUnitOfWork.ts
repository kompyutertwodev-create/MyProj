import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type {
  AccessControlTransactionContext,
  AccessControlUnitOfWork,
} from '../../application/ports/AccessControlUnitOfWork.js';
import { DrizzleRoleRepository } from '../repositories/DrizzleRoleRepository.js';
import { DrizzlePolicyRepository } from '../repositories/DrizzlePolicyRepository.js';
import { DrizzleRoleAssignmentRepository } from '../repositories/DrizzleRoleAssignmentRepository.js';
import { DrizzleOutboxRepository } from '../repositories/DrizzleOutboxRepository.js';

/**
 * Drizzle-backed AccessControlUnitOfWork.
 *
 * The top-level repositories are read-only conveniences that run against
 * the main connection. Every write must go through `withTransaction`,
 * which hands the callback a context bound to a transaction client вЂ”
 * guaranteeing the aggregate row and its outbox rows commit together.
 *
 * `begin` / `commit` / `rollback` are no-ops: Drizzle's `db.transaction`
 * manages the lifecycle of the connection and offers no manual control.
 * The interface keeps them for parity with other UnitOfWork implementations.
 */
export class DrizzleAccessControlUnitOfWork implements AccessControlUnitOfWork {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly db: NodePgDatabase<any>) {}

  get roles() {
    return new DrizzleRoleRepository(this.db);
  }

  get roleAssignments() {
    return new DrizzleRoleAssignmentRepository(this.db);
  }

  get policies() {
    return new DrizzlePolicyRepository(this.db);
  }

  async withTransaction<T>(
    work: (tx: AccessControlTransactionContext) => Promise<T>,
  ): Promise<T> {
    return this.db.transaction(async (transaction) => {
      // The transaction client exposes the same query surface as the main
      // connection but its generated generic is narrower вЂ” same reason we
      // cast to `any` at the repository boundary.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const txDb = transaction as any;
      const ctx: AccessControlTransactionContext = {
        roles: new DrizzleRoleRepository(txDb),
        roleAssignments: new DrizzleRoleAssignmentRepository(txDb),
        policies: new DrizzlePolicyRepository(txDb),
        outbox: new DrizzleOutboxRepository(txDb),
      };
      return work(ctx);
    });
  }

  async begin(): Promise<void> {
    // Drizzle manages the transaction lifecycle inside `db.transaction`.
  }

  async commit(): Promise<void> {
    // See `begin`.
  }

  async rollback(): Promise<void> {
    // See `begin`.
  }
}