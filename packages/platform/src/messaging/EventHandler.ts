import type { DomainEvent } from '@workspace/kernel';
export interface EventHandler<T extends DomainEvent = DomainEvent> {
  handle(event: T): Promise<void>;
}
