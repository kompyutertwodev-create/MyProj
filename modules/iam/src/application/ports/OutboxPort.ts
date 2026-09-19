import type {
  DomainEvent,
  EventContext,
  EventEnvelope,
} from '@workspace/kernel';

/**
 * Transactional outbox port.
 *
 * Handlers call these methods *inside* their Unit of Work so events are
 * persisted atomically with the aggregate. The `EventContext` carries
 * correlation / causation / actor / tenant metadata; when omitted the
 * adapter falls back to the ambient request context (see
 * `withAmbientContext` in @workspace/kernel).
 *
 * `enqueueEnvelopes` is the escape hatch for callers that already have
 * pre-wrapped envelopes.
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