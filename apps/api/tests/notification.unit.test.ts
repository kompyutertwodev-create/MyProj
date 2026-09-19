import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  Notification,
  NotificationChannel,
  NotificationStatus,
  InMemoryNotificationRepository,
  InMemoryNotificationSenderRegistry,
  FakeNotificationSender,
  SendNotificationHandler,
  ListNotificationsHandler,
  NotificationDispatcher,
  DefaultTemplateCatalog,
  type ContactResolver,
} from '@workspace/notification';
import type { DomainEvent } from '@workspace/kernel';

function makeHandler(failEmail = false) {
  const repository = new InMemoryNotificationRepository();
  const registry = new InMemoryNotificationSenderRegistry();
  const emailSender = new FakeNotificationSender(NotificationChannel.Email, failEmail ? 'smtp down' : undefined);
  const telegramSender = new FakeNotificationSender(NotificationChannel.Telegram);
  registry.register(emailSender);
  registry.register(telegramSender);
  const handler = new SendNotificationHandler(repository, registry);
  return { repository, registry, emailSender, telegramSender, handler };
}

function makeEvent(name: string, payload: Record<string, unknown>): DomainEvent {
  return {
    eventId: 'evt-' + Math.random().toString(36).slice(2, 10),
    eventName: name,
    occurredAt: new Date(),
    aggregateId: String(payload['userId'] ?? payload['tenantId'] ?? 'agg-1'),
    aggregateType: 'Test',
    ...payload,
  } as unknown as DomainEvent;
}

// ---------------------------------------------------------------------------
// Domain tests
// ---------------------------------------------------------------------------

test('Notification.create() builds a Pending notification', () => {
  const result = Notification.create({
    recipientId: 'user-1',
    contact: { channel: NotificationChannel.Email, value: 'user@example.com' } as never,
    subject: 'Welcome',
    body: 'Hello there',
  });
  assert.equal(result.isOk(), true);
  const n = result.value;
  assert.equal(n.recipientId.value, 'user-1');
  assert.equal(n.channel, NotificationChannel.Email);
  assert.equal(n.status, NotificationStatus.Pending);
  assert.equal(n.subject, 'Welcome');
  assert.equal(n.sentAt, null);
});

test('Notification.create() rejects empty subject and body', () => {
  const badSubject = Notification.create({
    recipientId: 'user-1',
    contact: { channel: NotificationChannel.Email, value: 'user@example.com' } as never,
    subject: '   ',
    body: 'body',
  });
  assert.equal(badSubject.isErr(), true);
  assert.equal(badSubject.error.code, 'NOTIFICATION_SUBJECT_EMPTY');

  const badBody = Notification.create({
    recipientId: 'user-1',
    contact: { channel: NotificationChannel.Email, value: 'user@example.com' } as never,
    subject: 'subj',
    body: '',
  });
  assert.equal(badBody.isErr(), true);
  assert.equal(badBody.error.code, 'NOTIFICATION_BODY_EMPTY');
});

test('Notification.markAsSent() transitions Pending -> Sent', () => {
  const n = Notification.create({
    recipientId: 'user-1',
    contact: { channel: NotificationChannel.Email, value: 'user@example.com' } as never,
    subject: 'S',
    body: 'B',
  }).getOrThrow();

  assert.equal(n.markAsSent().isOk(), true);
  assert.equal(n.status, NotificationStatus.Sent);
  assert.ok(n.sentAt instanceof Date);
});

test('Notification.markAsFailed() transitions Pending -> Failed with reason', () => {
  const n = Notification.create({
    recipientId: 'user-1',
    contact: { channel: NotificationChannel.Email, value: 'user@example.com' } as never,
    subject: 'S',
    body: 'B',
  }).getOrThrow();

  assert.equal(n.markAsFailed('smtp down').isOk(), true);
  assert.equal(n.status, NotificationStatus.Failed);
  assert.equal(n.errorMessage, 'smtp down');
});

// ---------------------------------------------------------------------------
// Application tests — SendNotificationHandler
// ---------------------------------------------------------------------------

test('SendNotificationHandler sends and persists a Sent notification', async () => {
  const { handler, repository, emailSender } = makeHandler();

  const result = await handler.execute({
    recipientId: 'user-1',
    channel: NotificationChannel.Email,
    contact: 'user@example.com',
    subject: 'Welcome',
    body: 'Hello',
  });

  assert.equal(result.isOk(), true);
  assert.equal(result.value.status, NotificationStatus.Sent);
  assert.equal(emailSender.sent.length, 1);

  const persisted = await repository.findById(result.value.notificationId);
  assert.ok(persisted);
  assert.equal(persisted.status, NotificationStatus.Sent);
});

test('SendNotificationHandler records a Failed notification when sender fails', async () => {
  const { handler, repository, emailSender } = makeHandler(true);

  const result = await handler.execute({
    recipientId: 'user-1',
    channel: NotificationChannel.Email,
    contact: 'user@example.com',
    subject: 'Welcome',
    body: 'Hello',
  });

  assert.equal(result.isOk(), true);
  assert.equal(result.value.status, NotificationStatus.Failed);
  assert.equal(result.value.errorMessage, 'smtp down');
  assert.equal(emailSender.sent.length, 0);

  const persisted = await repository.findById(result.value.notificationId);
  assert.ok(persisted);
  assert.equal(persisted.status, NotificationStatus.Failed);
});

test('SendNotificationHandler returns an error when channel has no sender', async () => {
  const repository = new InMemoryNotificationRepository();
  const registry = new InMemoryNotificationSenderRegistry();
  const handler = new SendNotificationHandler(repository, registry);

  const result = await handler.execute({
    recipientId: 'user-1',
    channel: NotificationChannel.Sms,
    contact: '+998901234567',
    subject: 'S',
    body: 'B',
  });

  assert.equal(result.isErr(), true);
  assert.equal(result.error.code, 'CHANNEL_NOT_CONFIGURED');
});

test('SendNotificationHandler rejects invalid contact', async () => {
  const { handler } = makeHandler();
  const result = await handler.execute({
    recipientId: 'user-1',
    channel: NotificationChannel.Email,
    contact: '   ',
    subject: 'S',
    body: 'B',
  });
  assert.equal(result.isErr(), true);
  assert.equal(result.error.code, 'VALIDATION_ERROR');
});

// ---------------------------------------------------------------------------
// Application tests — ListNotificationsHandler
// ---------------------------------------------------------------------------

test('ListNotificationsHandler paginates results', async () => {
  const { handler, repository } = makeHandler();
  const list = new ListNotificationsHandler(repository);

  for (let i = 1; i <= 5; i += 1) {
    await handler.execute({
      recipientId: `user-${i}`,
      channel: NotificationChannel.Email,
      contact: `user${i}@example.com`,
      subject: `Subject ${i}`,
      body: `Body ${i}`,
    });
  }

  const page1 = await list.execute({ page: 1, pageSize: 2 });
  assert.equal(page1.items.length, 2);
  assert.equal(page1.total, 5);
  assert.equal(page1.hasNextPage, true);

  const page3 = await list.execute({ page: 3, pageSize: 2 });
  assert.equal(page3.items.length, 1);
  assert.equal(page3.hasNextPage, false);
});

test('ListNotificationsHandler filters by recipientId and channel', async () => {
  const { handler, repository } = makeHandler();
  const list = new ListNotificationsHandler(repository);

  await handler.execute({
    recipientId: 'user-a',
    channel: NotificationChannel.Email,
    contact: 'a@example.com',
    subject: 'S',
    body: 'B',
  });
  await handler.execute({
    recipientId: 'user-b',
    channel: NotificationChannel.Telegram,
    contact: '123456',
    subject: 'S',
    body: 'B',
  });

  const byRecipient = await list.execute({ page: 1, pageSize: 10, recipientId: 'user-a' });
  assert.equal(byRecipient.items.length, 1);

  const byChannel = await list.execute({
    page: 1,
    pageSize: 10,
    channel: NotificationChannel.Telegram,
  });
  assert.equal(byChannel.items.length, 1);
  assert.equal(byChannel.items[0]?.channel, NotificationChannel.Telegram);
});

// ---------------------------------------------------------------------------
// Event dispatcher tests
// ---------------------------------------------------------------------------

class StaticContactResolver implements ContactResolver {
  constructor(private readonly map: Map<string, string>) {}
  async resolve(recipientId: string, channel: NotificationChannel) {
    if (channel !== NotificationChannel.Email) return null;
    const value = this.map.get(recipientId);
    if (!value) return null;
    return { channel, value };
  }
}

function makeDispatcher() {
  const { handler, repository, emailSender } = makeHandler();
  const contacts = new Map<string, string>([['user-42', 'new@example.com']]);
  const dispatcher = new NotificationDispatcher(
    handler,
    new StaticContactResolver(contacts),
    new DefaultTemplateCatalog()
  );
  return { dispatcher, repository, emailSender };
}

test('NotificationDispatcher sends a welcome email for iam.UserRegistered', async () => {
  const { dispatcher, repository, emailSender } = makeDispatcher();

  await dispatcher.handle(
    makeEvent('iam.UserRegistered', {
      userId: 'user-42',
      email: 'new@example.com',
      displayName: 'New User',
    })
  );

  const all = await repository.findAll({}, { limit: 10, offset: 0 });
  assert.equal(all.length, 1);
  assert.equal(all[0]?.recipientId.value, 'user-42');
  assert.equal(all[0]?.channel, NotificationChannel.Email);
  assert.match(all[0]?.subject ?? '', /Welcome/i);
  assert.equal(emailSender.sent.length, 1);
});

test('NotificationDispatcher skips events with no matching template', async () => {
  const { dispatcher, repository } = makeDispatcher();
  await dispatcher.handle(makeEvent('unknown.Event', { userId: 'user-42' }));
  const all = await repository.findAll({}, { limit: 10, offset: 0 });
  assert.equal(all.length, 0);
});

test('NotificationDispatcher skips events when contact cannot be resolved', async () => {
  const { dispatcher, repository } = makeDispatcher();
  await dispatcher.handle(makeEvent('iam.UserRegistered', { userId: 'unknown-user' }));
  const all = await repository.findAll({}, { limit: 10, offset: 0 });
  assert.equal(all.length, 0);
});
