import { expect, test } from 'vitest';
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
  expect(result.isOk()).toBe(true);
  const n = result.value;
  expect(n.recipientId.value).toBe('user-1');
  expect(n.channel).toBe(NotificationChannel.Email);
  expect(n.status).toBe(NotificationStatus.Pending);
  expect(n.subject).toBe('Welcome');
  expect(n.sentAt).toBeNull();
});

test('Notification.create() rejects empty subject and body', () => {
  const badSubject = Notification.create({
    recipientId: 'user-1',
    contact: { channel: NotificationChannel.Email, value: 'user@example.com' } as never,
    subject: '   ',
    body: 'body',
  });
  expect(badSubject.isErr()).toBe(true);
  expect(badSubject.error.code).toBe('NOTIFICATION_SUBJECT_EMPTY');

  const badBody = Notification.create({
    recipientId: 'user-1',
    contact: { channel: NotificationChannel.Email, value: 'user@example.com' } as never,
    subject: 'subj',
    body: '',
  });
  expect(badBody.isErr()).toBe(true);
  expect(badBody.error.code).toBe('NOTIFICATION_BODY_EMPTY');
});

test('Notification.markAsSent() transitions Pending -> Sent', () => {
  const n = Notification.create({
    recipientId: 'user-1',
    contact: { channel: NotificationChannel.Email, value: 'user@example.com' } as never,
    subject: 'S',
    body: 'B',
  }).getOrThrow();

  expect(n.markAsSent().isOk()).toBe(true);
  expect(n.status).toBe(NotificationStatus.Sent);
  expect(n.sentAt).toBeInstanceOf(Date);
});

test('Notification.markAsFailed() transitions Pending -> Failed with reason', () => {
  const n = Notification.create({
    recipientId: 'user-1',
    contact: { channel: NotificationChannel.Email, value: 'user@example.com' } as never,
    subject: 'S',
    body: 'B',
  }).getOrThrow();

  expect(n.markAsFailed('smtp down').isOk()).toBe(true);
  expect(n.status).toBe(NotificationStatus.Failed);
  expect(n.errorMessage).toBe('smtp down');
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

  expect(result.isOk()).toBe(true);
  expect(result.value.status).toBe(NotificationStatus.Sent);
  expect(emailSender.sent.length).toBe(1);

  const persisted = await repository.findById(result.value.notificationId);
  expect(persisted).toBeTruthy();
  expect(persisted!.status).toBe(NotificationStatus.Sent);
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

  expect(result.isOk()).toBe(true);
  expect(result.value.status).toBe(NotificationStatus.Failed);
  expect(result.value.errorMessage).toBe('smtp down');
  expect(emailSender.sent.length).toBe(0);

  const persisted = await repository.findById(result.value.notificationId);
  expect(persisted).toBeTruthy();
  expect(persisted!.status).toBe(NotificationStatus.Failed);
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

  expect(result.isErr()).toBe(true);
  expect(result.error.code).toBe('CHANNEL_NOT_CONFIGURED');
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
  expect(result.isErr()).toBe(true);
  expect(result.error.code).toBe('VALIDATION_ERROR');
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
  expect(page1.items.length).toBe(2);
  expect(page1.total).toBe(5);
  expect(page1.hasNextPage).toBe(true);

  const page3 = await list.execute({ page: 3, pageSize: 2 });
  expect(page3.items.length).toBe(1);
  expect(page3.hasNextPage).toBe(false);
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
  expect(byRecipient.items.length).toBe(1);

  const byChannel = await list.execute({
    page: 1,
    pageSize: 10,
    channel: NotificationChannel.Telegram,
  });
  expect(byChannel.items.length).toBe(1);
  expect(byChannel.items[0]?.channel).toBe(NotificationChannel.Telegram);
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
  expect(all.length).toBe(1);
  expect(all[0]?.recipientId.value).toBe('user-42');
  expect(all[0]?.channel).toBe(NotificationChannel.Email);
  expect(all[0]?.subject ?? '').toMatch(/Welcome/i);
  expect(emailSender.sent.length).toBe(1);
});

test('NotificationDispatcher skips events with no matching template', async () => {
  const { dispatcher, repository } = makeDispatcher();
  await dispatcher.handle(makeEvent('unknown.Event', { userId: 'user-42' }));
  const all = await repository.findAll({}, { limit: 10, offset: 0 });
  expect(all.length).toBe(0);
});

test('NotificationDispatcher skips events when contact cannot be resolved', async () => {
  const { dispatcher, repository } = makeDispatcher();
  await dispatcher.handle(makeEvent('iam.UserRegistered', { userId: 'unknown-user' }));
  const all = await repository.findAll({}, { limit: 10, offset: 0 });
  expect(all.length).toBe(0);
});