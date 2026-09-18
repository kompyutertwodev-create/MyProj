import type { MemberRepository } from '../../domain/repositories/MemberRepository.js';
import type { TenantRepository } from '../../domain/repositories/TenantRepository.js';
import type { OutboxPort } from './OutboxPort.js';

export interface TenantTransactionContext {
  tenants: TenantRepository;
  members: MemberRepository;
  outbox: OutboxPort;
}

export interface TenantUnitOfWork {
  run<T>(work: (context: TenantTransactionContext) => Promise<T>): Promise<T>;
}
