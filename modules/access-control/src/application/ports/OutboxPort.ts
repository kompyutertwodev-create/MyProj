import type { DomainEvent } from '@workspace/kernel';

/**
 * Transactional outbox port.
 *
 * Handlers call `enqueue` *inside* their Unit of Work so that the events
 * are persisted atomically with the aggregate. A separate dispatcher
 * (owned by the platform) drains the outbox and publishes to the real bus,
 * guaranteeing at-least-once delivery without distributed transactions.
 */
export interface OutboxPort {
  enqueue(event: DomainEvent): Promise<void>;
  enqueueAll(events: ReadonlyArray<DomainEvent>): Promise<void>;
}