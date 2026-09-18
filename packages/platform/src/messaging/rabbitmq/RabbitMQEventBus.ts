import type { DomainEvent } from '@workspace/kernel';
import type { EventBus } from '../EventBus.js';
import type { EventHandler } from '../EventHandler.js';
import type { RabbitChannel } from './RabbitMQConnection.js';
export class RabbitMQEventBus implements EventBus {
  constructor(
    private readonly channel: RabbitChannel,
    private readonly exchange = 'events'
  ) {}
  async publish(event: DomainEvent): Promise<void> {
    this.channel.publish(this.exchange, event.eventName, Buffer.from(JSON.stringify(event)), {
      contentType: 'application/json',
    });
  }
  subscribe<T extends DomainEvent>(name: string, handler: EventHandler<T>): () => void {
    const queue = `events.${name}.${Math.random().toString(36).slice(2)}`;
    void Promise.resolve(this.channel.assertExchange?.(this.exchange, 'topic', { durable: true }))
      .then(() => this.channel.assertQueue?.(queue, { exclusive: true }))
      .then(() => this.channel.bindQueue?.(queue, this.exchange, name))
      .then(() =>
        this.channel.consume(queue, (message) => {
          if (message) void handler.handle(JSON.parse(message.content.toString()) as T);
        })
      );
    return () => undefined;
  }
}
