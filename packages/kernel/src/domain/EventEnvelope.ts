import type { DomainEvent } from './DomainEvent.js';
import type { EventMetadata } from './EventMetadata.js';

/**
 * A domain event paired with the cross-cutting metadata attached by the
 * application layer.
 *
 * The event bus, the outbox and the message dispatcher all speak in terms
 * of envelopes rather than bare events so that consumers always have
 * access to the causal context (correlation, causation, actor, tenant).
 *
 * Deliberately generic so a typed bus can express
 * `EventEnvelope<UserRegisteredEvent>` without losing the concrete payload
 * type.
 */
export interface EventEnvelope<TEvent extends DomainEvent = DomainEvent> {
  readonly event: TEvent;
  readonly metadata: EventMetadata;
}

/**
 * Wrap a bare domain event with an empty metadata object.
 *
 * Useful in tests and for handlers that do not yet thread metadata through.
 */
export function envelopeOf<TEvent extends DomainEvent>(
  event: TEvent,
  metadata: EventMetadata = {},
): EventEnvelope<TEvent> {
  return { event, metadata };
}