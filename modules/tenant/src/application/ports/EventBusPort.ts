import type { DomainEvent, EventContext } from '@workspace/kernel';

/**
 * Application-facing event bus port.
 *
 * `publish`/`publishAll` accept an optional `EventContext` so callers can
 * attach correlation / causation / actor / tenant metadata. When omitted,
 * the adapter falls back to the ambient request context.
 */
export interface EventBusPort {
  publish(event: DomainEvent, context?: EventContext): Promise<void>;
  publishAll(
    events: ReadonlyArray<DomainEvent>,
    context?: EventContext,
  ): Promise<void>;
}