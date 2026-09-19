import { expect, test } from 'vitest';
import {
  OutboxEventBus,
  OutboxEventDispatcher,
  type EventBus,
  type EventHandler,
  type OutboxMessage,
  type OutboxStore,
} from '@workspace/platform';
import type { DomainEvent } from '@workspace/kernel';

const event: DomainEvent = {
  eventId: 'event-1',
  eventName: 'iam.UserRegistered',
  occurredAt: new Date('2026-09-02T00:00:00.000Z'),
  aggregateId: 'user-1',
  aggregateType: 'User',
};

class FakeStore implements OutboxStore {
  enqueued: DomainEvent[] = [];
  published: string[] = [];
  failed: Array<{ id: string; error: string; retryAt: Date }> = [];
  messages: OutboxMessage[] = [];

  async enqueue(next: DomainEvent): Promise<void> {
    this.enqueued.push(next);
  }

  async enqueueAll(next: DomainEvent[]): Promise<void> {
    this.enqueued.push(...next);
  }

  async claimBatch(): Promise<OutboxMessage[]> {
    const messages = this.messages;
    this.messages = [];
    return messages;
  }

  async markPublished(id: string): Promise<void> {
    this.published.push(id);
  }

  async markFailed(id: string, _workerId: string, error: string, retryAt: Date): Promise<void> {
    this.failed.push({ id, error, retryAt });
  }
}

class FakeTransport implements EventBus {
  readonly published: DomainEvent[] = [];
  constructor(private readonly failure?: Error) {}

  async publish(next: DomainEvent): Promise<void> {
    if (this.failure) throw this.failure;
    this.published.push(next);
  }

  subscribe<T extends DomainEvent>(_name: string, _handler: EventHandler<T>): () => void {
    return () => undefined;
  }
}

test('OutboxEventBus durably enqueues single and batched events', async () => {
  const store = new FakeStore();
  const bus = new OutboxEventBus(store, new FakeTransport());

  await bus.publish(event);
  await bus.publishAll([event]);

  expect(store.enqueued).toEqual([event, event]);
});

test('dispatcher marks delivered events as published', async () => {
  const store = new FakeStore();
  store.messages = [{ id: event.eventId, event, attempts: 1 }];
  const transport = new FakeTransport();
  const dispatcher = new OutboxEventDispatcher(store, transport);

  expect(await dispatcher.dispatchOnce()).toBe(1);
  expect(transport.published).toEqual([event]);
  expect(store.published).toEqual([event.eventId]);
  expect(store.failed).toEqual([]);
});

test('dispatcher returns failed deliveries to retry state', async () => {
  const store = new FakeStore();
  store.messages = [{ id: event.eventId, event, attempts: 2 }];
  const dispatcher = new OutboxEventDispatcher(
    store,
    new FakeTransport(new Error('broker offline'))
  );

  expect(await dispatcher.dispatchOnce()).toBe(1);
  expect(store.published).toEqual([]);
  expect(store.failed.length).toBe(1);
  expect(store.failed[0]?.id).toBe(event.eventId);
  expect(store.failed[0]?.error).toBe('broker offline');
  expect(store.failed[0]?.retryAt.getTime()).toBeGreaterThan(Date.now());
});