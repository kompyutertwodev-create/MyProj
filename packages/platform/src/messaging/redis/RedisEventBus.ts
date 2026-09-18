import type Redis from 'ioredis';
import type { DomainEvent } from '@workspace/kernel';
import type { EventBus } from '../EventBus.js';
import type { EventHandler } from '../EventHandler.js';
export class RedisEventBus implements EventBus {
  constructor(
    private readonly publisher: Redis,
    private readonly subscriber: Redis = publisher,
    private readonly channel = 'events'
  ) {}
  async publish(event: DomainEvent): Promise<void> {
    await this.publisher.publish(this.channel, JSON.stringify(event));
  }
  subscribe<T extends DomainEvent>(name: string, handler: EventHandler<T>): () => void {
    const listener = (channel: string, raw: string) => {
      if (channel !== this.channel) return;
      const event = JSON.parse(raw) as T;
      if (event.eventName === name) void handler.handle(event);
    };
    this.subscriber.on('message', listener);
    void this.subscriber.subscribe(this.channel);
    return () => {
      this.subscriber.off('message', listener);
    };
  }
}
