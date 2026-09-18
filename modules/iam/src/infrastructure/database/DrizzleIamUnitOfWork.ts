import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type {
  IamTransactionContext,
  IamUnitOfWork,
} from '../../application/ports/IamUnitOfWork.js';
import { DrizzleRoleRepository } from '../repositories/DrizzleRoleRepository.js';
import { DrizzleSessionRepository } from '../repositories/DrizzleSessionRepository.js';
import { DrizzleSocialIdentityRepository } from '../repositories/DrizzleSocialIdentityRepository.js';
import { DrizzleUserRepository } from '../repositories/DrizzleUserRepository.js';
import { DrizzleOutboxRepository } from '../repositories/DrizzleOutboxRepository.js';

export class DrizzleIamUnitOfWork implements IamUnitOfWork {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly db: NodePgDatabase<any>) {}

  async run<T>(work: (context: IamTransactionContext) => Promise<T>): Promise<T> {
    return this.db.transaction(async (transaction) => {
      // Drizzle's transaction client has the same query surface as the
      // database client, while its generated generic type is narrower.
      // Repository adapters intentionally hide that generated type.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const txDb = transaction as any;
      return work({
        users: new DrizzleUserRepository(txDb),
        roles: new DrizzleRoleRepository(txDb),
        sessions: new DrizzleSessionRepository(txDb),
        socialIdentities: new DrizzleSocialIdentityRepository(txDb),
        outbox: new DrizzleOutboxRepository(txDb),
      });
    });
  }
}
