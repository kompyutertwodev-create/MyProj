import type { DomainEvent } from './DomainEvent.js';
import { Entity } from './Entity.js';
import { UniqueId } from './UniqueId.js';

/**
 * Aggregate root — the consistency boundary of a DDD aggregate.
 * Only aggregate roots are directly loaded from and persisted to repositories.
 */
export abstract class AggregateRoot<TId extends UniqueId = UniqueId> extends Entity<TId> {
  /** Version used for optimistic concurrency (increment on each save). */
  #version: number;

  protected constructor(id: TId, version = 0) {
    super(id);
    this.#version = version;
  }

  get version(): number {
    return this.#version;
  }

  protected apply(event: DomainEvent): void {
    this.addDomainEvent(event);
    this.#version += 1;
  }
}
