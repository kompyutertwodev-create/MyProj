import assert from 'node:assert/strict';
import { test } from 'node:test';
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

  assert.deepEqual(store.enqueued, [event, event]);
});

test('dispatcher marks delivered events as published', async () => {
  const store = new FakeStore();
  store.messages = [{ id: event.eventId, event, attempts: 1 }];
  const transport = new FakeTransport();
  const dispatcher = new OutboxEventDispatcher(store, transport);

  assert.equal(await dispatcher.dispatchOnce(), 1);
  assert.deepEqual(transport.published, [event]);
  assert.deepEqual(store.published, [event.eventId]);
  assert.deepEqual(store.failed, []);
});

test('dispatcher returns failed deliveries to retry state', async () => {
  const store = new FakeStore();
  store.messages = [{ id: event.eventId, event, attempts: 2 }];
  const dispatcher = new OutboxEventDispatcher(
    store,
    new FakeTransport(new Error('broker offline'))
  );

  assert.equal(await dispatcher.dispatchOnce(), 1);
  assert.deepEqual(store.published, []);
  assert.equal(store.failed.length, 1);
  assert.equal(store.failed[0]?.id, event.eventId);
  assert.equal(store.failed[0]?.error, 'broker offline');
  assert.ok(store.failed[0]?.retryAt.getTime() > Date.now());
});
