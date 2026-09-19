import type { SessionRepository } from '../../domain/repositories/SessionRepository.js';
import type { SocialIdentityRepository } from '../../domain/oauth/SocialIdentityRepository.js';
import type { UserRepository } from '../../domain/repositories/UserRepository.js';
import type { OutboxPort } from './OutboxPort.js';

/**
 * Transaction-scoped view of the IAM repositories.
 *
 * RBAC is deliberately absent: roles / permissions / policies live in
 * @workspace/access-control, which owns its own unit of work. This
 * context stays focused on identity data.
 */
export interface IamTransactionContext {
  users: UserRepository;
  sessions: SessionRepository;
  socialIdentities: SocialIdentityRepository;
  outbox: OutboxPort;
}

export interface IamUnitOfWork {
  run<T>(work: (context: IamTransactionContext) => Promise<T>): Promise<T>;
}