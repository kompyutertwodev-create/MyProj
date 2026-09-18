import type { DomainEvent } from '@workspace/kernel';

/** Transaction-scoped event enqueueing boundary. */
export interface OutboxPort {
  enqueue(event: DomainEvent): Promise<void>;
  enqueueAll(events: DomainEvent[]): Promise<void>;
}
