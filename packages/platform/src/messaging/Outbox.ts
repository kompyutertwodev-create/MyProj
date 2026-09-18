import type { DomainEvent } from '@workspace/kernel';
import { randomUUID } from 'node:crypto';
import type { EventBus } from './EventBus.js';
import type { EventHandler } from './EventHandler.js';

export interface OutboxMessage {
  id: string;
  event: DomainEvent;
  attempts: number;
}

export interface OutboxStore {
  enqueue(event: DomainEvent): Promise<void>;
  enqueueAll(events: DomainEvent[]): Promise<void>;
  claimBatch(workerId: string, limit: number, leaseMs: number): Promise<OutboxMessage[]>;
  markPublished(id: string, workerId: string): Promise<void>;
  markFailed(id: string, workerId: string, error: string, retryAt: Date): Promise<void>;
}

/**
 * Application-facing event bus. Publishing means durably enqueueing an event;
 * a dispatcher delivers it to the platform transport after the DB commit.
 */
export class OutboxEventBus implements EventBus {
  constructor(
    private readonly store: OutboxStore,
    private readonly transport: EventBus
  ) {}

  publish(event: DomainEvent): Promise<void> {
    return this.store.enqueue(event);
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    await this.store.enqueueAll(events);
  }

  subscribe<T extends DomainEvent>(eventName: string, handler: EventHandler<T>): () => void {
    return this.transport.subscribe(eventName, handler);
  }
}

/**
 * At-least-once outbox delivery with leased claims and exponential retry.
 * Consumers should be idempotent because a process can crash after delivery
 * but before the published marker is committed.
 */
export class OutboxEventDispatcher {
  private timer?: ReturnType<typeof setInterval>;
  private readonly workerId = `outbox-${randomUUID()}`;

  constructor(
    private readonly store: OutboxStore,
    private readonly transport: EventBus
  ) {}

  start(intervalMs = 1000): void {
    if (this.timer) return;
    void this.dispatchOnce().catch(() => undefined);
    this.timer = setInterval(() => {
      void this.dispatchOnce().catch(() => undefined);
    }, intervalMs);
    this.timer.unref?.();
  }

  stop(): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = undefined;
  }

  async dispatchOnce(limit = 50): Promise<number> {
    const messages = await this.store.claimBatch(this.workerId, limit, 60_000);
    for (const message of messages) {
      try {
        await this.transport.publish(message.event);
        await this.store.markPublished(message.id, this.workerId);
      } catch (error) {
        const retryDelayMs = Math.min(60_000, 1000 * 2 ** Math.min(message.attempts, 6));
        await this.store.markFailed(
          message.id,
          this.workerId,
          error instanceof Error ? error.message : 'Event delivery failed',
          new Date(Date.now() + retryDelayMs)
        );
      }
    }
    return messages.length;
  }
}
