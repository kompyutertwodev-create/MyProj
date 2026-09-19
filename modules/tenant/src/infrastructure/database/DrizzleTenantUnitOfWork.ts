import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type {
  TenantTransactionContext,
  TenantUnitOfWork,
} from '../../application/ports/TenantUnitOfWork.js';
import { DrizzleTenantRepository } from '../repositories/DrizzleTenantRepository.js';
import { DrizzleMemberRepository } from '../repositories/DrizzleMemberRepository.js';
import { DrizzleOutboxRepository } from '../repositories/DrizzleOutboxRepository.js';

/**
 * Drizzle-backed UnitOfWork for the tenant module.
 *
 * Hands the callback a fresh, transaction-bound context so the aggregate
 * save, member save and outbox enqueue all commit together.
 */
export class DrizzleTenantUnitOfWork implements TenantUnitOfWork {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly db: NodePgDatabase<any>) {}

  async withTransaction<T>(
    work: (tx: TenantTransactionContext) => Promise<T>,
  ): Promise<T> {
    return this.db.transaction(async (transaction) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const txDb = transaction as any;
      return work({
        tenants: new DrizzleTenantRepository(txDb),
        members: new DrizzleMemberRepository(txDb),
        outbox: new DrizzleOutboxRepository(txDb),
      });
    });
  }
}