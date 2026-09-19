import type {
  DomainEvent,
  EventContext,
  EventEnvelope,
} from '@workspace/kernel';

/**
 * Transactional outbox port.
 *
 * Handlers call these methods *inside* their Unit of Work so that events
 * are persisted atomically with the aggregate. A separate dispatcher
 * (owned by the platform) drains the outbox and publishes to the real bus,
 * guaranteeing at-least-once delivery without distributed transactions.
 *
 * The primary API accepts bare domain events; the optional `EventContext`
 * carries correlation / causation / actor / tenant metadata. When omitted,
 * the adapter falls back to an empty context вЂ” handlers do not need to
 * thread it through until they are ready.
 *
 * `enqueueEnvelopes` is the escape hatch for callers that already have
 * pre-wrapped envelopes (e.g. a relay re-publishing from another source).
 */
export interface OutboxPort {
  /** Enqueue a single domain event with optional request context. */
  enqueue(event: DomainEvent, context?: EventContext): Promise<void>;

  /** Enqueue multiple domain events in one batch with shared context. */
  enqueueAll(
    events: ReadonlyArray<DomainEvent>,
    context?: EventContext,
  ): Promise<void>;

  /** Advanced: enqueue pre-wrapped envelopes directly. */
  enqueueEnvelopes(envelopes: ReadonlyArray<EventEnvelope>): Promise<void>;
}