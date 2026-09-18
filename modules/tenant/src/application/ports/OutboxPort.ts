import type { DomainEvent } from '@workspace/kernel';

/**
 * Port for storing domain events in an outbox table.
 * The outbox ensures at-least-once delivery of events: they are written
 * transactionally with the aggregate and dispatched later by a worker.
 */
export interface OutboxPort {
  enqueue(event: DomainEvent): Promise<void>;
  enqueueAll(events: DomainEvent[]): Promise<void>;
}
