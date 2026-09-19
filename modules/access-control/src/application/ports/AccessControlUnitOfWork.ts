import type { UnitOfWork } from '@workspace/kernel';
import type { RoleRepository } from '../../domain/role/RoleRepository.js';
import type { RoleAssignmentRepository } from '../../domain/assignment/RoleAssignmentRepository.js';
import type { PolicyRepository } from '../../domain/policy/PolicyRepository.js';
import type { OutboxPort } from './OutboxPort.js';

/**
 * Transaction-scoped view of the access-control repositories.
 *
 * A handler that receives a `AccessControlTransactionContext` is guaranteed
 * that every repository method runs inside the same database transaction.
 * The context is created by `UnitOfWork.withTransaction` and should not be
 * stored beyond the callback's lifetime.
 */
export interface AccessControlTransactionContext {
  readonly roles: RoleRepository;
  readonly roleAssignments: RoleAssignmentRepository;
  readonly policies: PolicyRepository;
  readonly outbox: OutboxPort;
}

/**
 * Module-specific Unit of Work.
 *
 * `withTransaction` provides a fresh, transaction-bound context to the
 * callback. The top-level repositories on the UoW itself are convenience
 * accessors for read-only queries; every write must go through a
 * transaction context so the aggregate save and its outbox rows are
 * committed atomically.
 */
export interface AccessControlUnitOfWork extends UnitOfWork {
  /** Convenience accessor for read-only queries outside a transaction. */
  readonly roles: RoleRepository;
  readonly roleAssignments: RoleAssignmentRepository;
  readonly policies: PolicyRepository;

  /**
   * Run `work` inside a single atomic transaction.
   *
   * The callback receives a fresh context whose repositories are bound to
   * the transaction client. Do not capture the context beyond the call.
   */
  withTransaction<T>(
    work: (tx: AccessControlTransactionContext) => Promise<T>,
  ): Promise<T>;
}