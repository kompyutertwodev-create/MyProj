import type { UniqueId } from './UniqueId.js';
import type { AggregateRoot } from './AggregateRoot.js';

/**
 * Generic repository interface — the port between application and infrastructure.
 * Concrete implementations live in each module's infrastructure/repositories/ layer.
 */
export interface Repository<TEntity extends AggregateRoot, TId extends UniqueId = UniqueId> {
  findById(id: TId): Promise<TEntity | null>;
  save(entity: TEntity): Promise<void>;
  delete(id: TId): Promise<void>;
}
