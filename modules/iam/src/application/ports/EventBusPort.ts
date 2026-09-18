import type { DomainEvent } from '@workspace/kernel';

export interface EventBusPort {
  publish(event: DomainEvent): Promise<void>;
  publishAll(events: DomainEvent[]): Promise<void>;
}
