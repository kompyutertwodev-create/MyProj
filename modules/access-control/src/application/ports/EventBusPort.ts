import type { DomainEvent } from '@workspace/kernel';

/**
 * Outbound port for publishing domain events.
 *
 * The application layer must not know whether events are delivered
 * in-process, via an outbox table, or over a message broker вЂ” it only
 * declares intent. Concrete adapters live in infrastructure or in the
 * platform package.
 */
export interface EventBusPort {
  publish(event: DomainEvent): Promise<void>;
  publishAll(events: ReadonlyArray<DomainEvent>): Promise<void>;
}