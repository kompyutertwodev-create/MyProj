import { expect, test } from 'vitest';
import {
  AuditEventType,
  AuditLog,
  AuditEventSubscriber,
  InMemoryAuditLogRepository,
  ListAuditLogsHandler,
  RecordAuditHandler,
} from '@workspace/audit';
import type { DomainEvent } from '@workspace/kernel';

function makeHandler() {
  const repository = new InMemoryAuditLogRepository();
  const handler = new RecordAuditHandler(repository);
  return { repository, handler };
}

// ---------------------------------------------------------------------------
// Domain tests
// ---------------------------------------------------------------------------

test('AuditLog.create() builds an immutable audit entry', () => {
  const result = AuditLog.create({
    eventType: AuditEventType.UserRegistered,
    actorId: 'user-1',
    tenantId: null,
    targetType: 'User',
    targetId: 'user-1',
    metadata: { email: 'test@example.com' },
    ipAddress: '127.0.0.1',
    userAgent: 'node:test',
  });

  expect(result.isOk()).toBe(true);
  const log = result.value;
  expect(log.eventType).toBe(AuditEventType.UserRegistered);
  expect(log.actorId.value).toBe('user-1');
  expect(log.tenantRef.value).toBeNull();
  expect(log.targetType).toBe('User');
  expect(log.targetId).toBe('user-1');
  expect(log.metadata.email).toBe('test@example.com');
  expect(log.ipAddress).toBe('127.0.0.1');
  expect(log.userAgent).toBe('node:test');
});

test('AuditLog.create() rejects empty actor id', () => {
  const result = AuditLog.create({
    eventType: AuditEventType.UserRegistered,
    actorId: '   ',
    targetType: 'User',
    targetId: 'user-1',
  });
  expect(result.isErr()).toBe(true);
  expect(result.error.code).toBe('ACTOR_ID_EMPTY');
});

test('AuditLog.create() rejects empty target type and id', () => {
  const badTarget = AuditLog.create({
    eventType: AuditEventType.UserRegistered,
    actorId: 'user-1',
    targetType: '',
    targetId: 'user-1',
  });
  expect(badTarget.isErr()).toBe(true);
  expect(badTarget.error.code).toBe('AUDIT_TARGET_TYPE_EMPTY');

  const badId = AuditLog.create({
    eventType: AuditEventType.UserRegistered,
    actorId: 'user-1',
    targetType: 'User',
    targetId: '',
  });
  expect(badId.isErr()).toBe(true);
  expect(badId.error.code).toBe('AUDIT_TARGET_ID_EMPTY');
});

test('AuditLog.create() preserves tenant reference when provided', () => {
  const result = AuditLog.create({
    eventType: AuditEventType.TenantCreated,
    actorId: 'owner-1',
    tenantId: 'tenant-42',
    targetType: 'Tenant',
    targetId: 'tenant-42',
  });
  expect(result.isOk()).toBe(true);
  expect(result.value.tenantRef.value).toBe('tenant-42');
});

// ---------------------------------------------------------------------------
// Application tests — RecordAuditHandler
// ---------------------------------------------------------------------------

test('RecordAuditHandler persists an audit log', async () => {
  const { repository, handler } = makeHandler();

  const result = await handler.execute({
    eventType: AuditEventType.UserRegistered,
    actorId: 'user-1',
    targetType: 'User',
    targetId: 'user-1',
    metadata: { email: 'test@example.com' },
  });

  expect(result.isOk()).toBe(true);
  const saved = await repository.findById(result.value.auditLogId);
  expect(saved).toBeTruthy();
  expect(saved!.eventType).toBe(AuditEventType.UserRegistered);
  expect(saved!.actorId.value).toBe('user-1');
});

test('RecordAuditHandler returns validation error for empty actor id', async () => {
  const { handler } = makeHandler();

  const result = await handler.execute({
    eventType: AuditEventType.UserRegistered,
    actorId: '',
    targetType: 'User',
    targetId: 'user-1',
  });

  expect(result.isErr()).toBe(true);
  expect(result.error.code).toBe('VALIDATION_ERROR');
});

// ---------------------------------------------------------------------------
// Application tests — ListAuditLogsHandler
// ---------------------------------------------------------------------------

test('ListAuditLogsHandler paginates results', async () => {
  const { repository, handler } = makeHandler();
  const list = new ListAuditLogsHandler(repository);

  for (let i = 1; i <= 5; i += 1) {
    await handler.execute({
      eventType: AuditEventType.UserRegistered,
      actorId: `user-${i}`,
      targetType: 'User',
      targetId: `user-${i}`,
    });
  }

  const page1 = await list.execute({ page: 1, pageSize: 2 });
  expect(page1.items.length).toBe(2);
  expect(page1.total).toBe(5);
  expect(page1.hasNextPage).toBe(true);
  expect(page1.hasPreviousPage).toBe(false);

  const page2 = await list.execute({ page: 2, pageSize: 2 });
  expect(page2.items.length).toBe(2);
  expect(page2.hasNextPage).toBe(true);
  expect(page2.hasPreviousPage).toBe(true);

  const page3 = await list.execute({ page: 3, pageSize: 2 });
  expect(page3.items.length).toBe(1);
  expect(page3.hasNextPage).toBe(false);
});

test('ListAuditLogsHandler filters by actorId', async () => {
  const { repository, handler } = makeHandler();
  const list = new ListAuditLogsHandler(repository);

  await handler.execute({
    eventType: AuditEventType.UserRegistered,
    actorId: 'actor-a',
    targetType: 'User',
    targetId: 'user-1',
  });
  await handler.execute({
    eventType: AuditEventType.UserRegistered,
    actorId: 'actor-b',
    targetType: 'User',
    targetId: 'user-2',
  });

  const filtered = await list.execute({ page: 1, pageSize: 10, actorId: 'actor-a' });
  expect(filtered.items.length).toBe(1);
  expect(filtered.items[0]?.actorId).toBe('actor-a');
});

test('ListAuditLogsHandler filters by eventType', async () => {
  const { repository, handler } = makeHandler();
  const list = new ListAuditLogsHandler(repository);

  await handler.execute({
    eventType: AuditEventType.UserRegistered,
    actorId: 'user-1',
    targetType: 'User',
    targetId: 'user-1',
  });
  await handler.execute({
    eventType: AuditEventType.TenantCreated,
    actorId: 'user-2',
    targetType: 'Tenant',
    targetId: 'tenant-1',
  });

  const filtered = await list.execute({
    page: 1,
    pageSize: 10,
    eventType: AuditEventType.TenantCreated,
  });
  expect(filtered.items.length).toBe(1);
  expect(filtered.items[0]?.eventType).toBe(AuditEventType.TenantCreated);
});

// ---------------------------------------------------------------------------
// Event subscriber tests
// ---------------------------------------------------------------------------

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

test('AuditEventSubscriber records iam.UserRegistered events', async () => {
  const { repository, handler } = makeHandler();
  const subscriber = new AuditEventSubscriber(handler);

  await subscriber.handle(
    makeEvent('iam.UserRegistered', {
      userId: 'user-42',
      email: 'new@example.com',
      displayName: 'New User',
    })
  );

  const all = await repository.findAll({}, { limit: 10, offset: 0 });
  expect(all.length).toBe(1);
  expect(all[0]?.eventType).toBe(AuditEventType.UserRegistered);
  expect(all[0]?.actorId.value).toBe('user-42');
  expect(all[0]?.metadata['email']).toBe('new@example.com');
});

test('AuditEventSubscriber records tenant.created events with tenant scope', async () => {
  const { repository, handler } = makeHandler();
  const subscriber = new AuditEventSubscriber(handler);

  await subscriber.handle(
    makeEvent('tenant.created', {
      ownerUserId: 'owner-1',
      name: 'Acme Corp',
      slug: 'acme-corp',
    })
  );

  const all = await repository.findAll({}, { limit: 10, offset: 0 });
  expect(all.length).toBe(1);
  expect(all[0]?.eventType).toBe(AuditEventType.TenantCreated);
  expect(all[0]?.actorId.value).toBe('owner-1');
  expect(all[0]?.metadata['slug']).toBe('acme-corp');
});

test('AuditEventSubscriber ignores unknown events', async () => {
  const { repository, handler } = makeHandler();
  const subscriber = new AuditEventSubscriber(handler);

  await subscriber.handle(makeEvent('unknown.Event', { foo: 'bar' }));

  const all = await repository.findAll({}, { limit: 10, offset: 0 });
  expect(all.length).toBe(0);
});