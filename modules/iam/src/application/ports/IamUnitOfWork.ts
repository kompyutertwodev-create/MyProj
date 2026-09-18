import type { RoleRepository } from '../../domain/repositories/RoleRepository.js';
import type { SessionRepository } from '../../domain/repositories/SessionRepository.js';
import type { SocialIdentityRepository } from '../../domain/oauth/SocialIdentityRepository.js';
import type { UserRepository } from '../../domain/repositories/UserRepository.js';
import type { OutboxPort } from './OutboxPort.js';

export interface IamTransactionContext {
  users: UserRepository;
  roles: RoleRepository;
  sessions: SessionRepository;
  socialIdentities: SocialIdentityRepository;
  outbox: OutboxPort;
}

export interface IamUnitOfWork {
  run<T>(work: (context: IamTransactionContext) => Promise<T>): Promise<T>;
}
