import type { DomainEvent } from '@workspace/kernel';
import type { EventHandler } from './EventHandler.js';
export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe<T extends DomainEvent>(eventName: string, handler: EventHandler<T>): () => void;
}
