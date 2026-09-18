import type { DomainEvent } from '@workspace/kernel';
import type { EventBusPort } from '../../application/ports/EventBusPort.js';

/**
 * Deterministic in-process bus for the development composition root and tests.
 * Production can replace this adapter with the platform message bus without
 * changing IAM application handlers.
 */
export class InMemoryIamEventBus implements EventBusPort {
  private readonly events: DomainEvent[] = [];

  async publish(event: DomainEvent): Promise<void> {
    this.events.push(event);
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) await this.publish(event);
  }

  snapshot(): readonly DomainEvent[] {
    return [...this.events];
  }

  clear(): void {
    this.events.length = 0;
  }
}
