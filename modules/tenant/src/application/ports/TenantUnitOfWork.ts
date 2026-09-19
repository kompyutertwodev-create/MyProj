import type { MemberRepository } from '../../domain/repositories/MemberRepository.js';
import type { TenantRepository } from '../../domain/repositories/TenantRepository.js';
import type { OutboxPort } from './OutboxPort.js';

/**
 * Transaction-scoped view of the tenant repositories.
 *
 * Handlers receive a fresh context bound to a single transaction, so
 * every write inside the callback commits or rolls back together.
 */
export interface TenantTransactionContext {
  tenants: TenantRepository;
  members: MemberRepository;
  outbox: OutboxPort;
}

/**
 * Module-specific Unit of Work.
 *
 * `withTransaction` provides a fresh, transaction-bound context to the
 * callback. The top-level repositories on the UoW are not exposed; every
 * write must go through the context.
 */
export interface TenantUnitOfWork {
  withTransaction<T>(
    work: (tx: TenantTransactionContext) => Promise<T>,
  ): Promise<T>;
}