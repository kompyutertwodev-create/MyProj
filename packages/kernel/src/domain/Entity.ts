import type { DomainEvent } from './DomainEvent.js';
import { UniqueId } from './UniqueId.js';

/**
 * Base class for all domain entities.
 * Identity equality: two entities are equal iff their IDs are equal,
 * regardless of attribute values.
 */
export abstract class Entity<TId extends UniqueId = UniqueId> {
  readonly #id: TId;
  readonly #domainEvents: DomainEvent[] = [];

  protected constructor(id: TId) {
    this.#id = id;
  }

  get id(): TId {
    return this.#id;
  }

  /** Accumulated domain events not yet dispatched. */
  get domainEvents(): ReadonlyArray<DomainEvent> {
    return this.#domainEvents;
  }

  protected addDomainEvent(event: DomainEvent): void {
    this.#domainEvents.push(event);
  }

  /** Drains and returns all accumulated events. Call after persisting. */
  pullDomainEvents(): DomainEvent[] {
    return this.#domainEvents.splice(0);
  }

  equals(other: Entity<TId>): boolean {
    if (other === this) return true;
    if (!(other instanceof Entity)) return false;
    return this.#id.equals(other.#id);
  }
}
