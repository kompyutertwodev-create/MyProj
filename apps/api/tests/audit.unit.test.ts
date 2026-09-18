import assert from 'node:assert/strict';
import { test } from 'node:test';
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

  assert.equal(result.isOk(), true);
  const log = result.value;
  assert.equal(log.eventType, AuditEventType.UserRegistered);
  assert.equal(log.actorId.value, 'user-1');
  assert.equal(log.tenantRef.value, null);
  assert.equal(log.targetType, 'User');
  assert.equal(log.targetId, 'user-1');
  assert.equal(log.metadata.email, 'test@example.com');
  assert.equal(log.ipAddress, '127.0.0.1');
  assert.equal(log.userAgent, 'node:test');
});

test('AuditLog.create() rejects empty actor id', () => {
  const result = AuditLog.create({
    eventType: AuditEventType.UserRegistered,
    actorId: '   ',
    targetType: 'User',
    targetId: 'user-1',
  });
  assert.equal(result.isErr(), true);
  assert.equal(result.error.code, 'ACTOR_ID_EMPTY');
});

test('AuditLog.create() rejects empty target type and id', () => {
  const badTarget = AuditLog.create({
    eventType: AuditEventType.UserRegistered,
    actorId: 'user-1',
    targetType: '',
    targetId: 'user-1',
  });
  assert.equal(badTarget.isErr(), true);
  assert.equal(badTarget.error.code, 'AUDIT_TARGET_TYPE_EMPTY');

  const badId = AuditLog.create({
    eventType: AuditEventType.UserRegistered,
    actorId: 'user-1',
    targetType: 'User',
    targetId: '',
  });
  assert.equal(badId.isErr(), true);
  assert.equal(badId.error.code, 'AUDIT_TARGET_ID_EMPTY');
});

test('AuditLog.create() preserves tenant reference when provided', () => {
  const result = AuditLog.create({
    eventType: AuditEventType.TenantCreated,
    actorId: 'owner-1',
    tenantId: 'tenant-42',
    targetType: 'Tenant',
    targetId: 'tenant-42',
  });
  assert.equal(result.isOk(), true);
  assert.equal(result.value.tenantRef.value, 'tenant-42');
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

  assert.equal(result.isOk(), true);
  const saved = await repository.findById(result.value.auditLogId);
  assert.ok(saved);
  assert.equal(saved.eventType, AuditEventType.UserRegistered);
  assert.equal(saved.actorId.value, 'user-1');
});

test('RecordAuditHandler returns validation error for empty actor id', async () => {
  const { handler } = makeHandler();

  const result = await handler.execute({
    eventType: AuditEventType.UserRegistered,
    actorId: '',
    targetType: 'User',
    targetId: 'user-1',
  });

  assert.equal(result.isErr(), true);
  assert.equal(result.error.code, 'VALIDATION_ERROR');
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
  assert.equal(page1.items.length, 2);
  assert.equal(page1.total, 5);
  assert.equal(page1.hasNextPage, true);
  assert.equal(page1.hasPreviousPage, false);

  const page2 = await list.execute({ page: 2, pageSize: 2 });
  assert.equal(page2.items.length, 2);
  assert.equal(page2.hasNextPage, true);
  assert.equal(page2.hasPreviousPage, true);

  const page3 = await list.execute({ page: 3, pageSize: 2 });
  assert.equal(page3.items.length, 1);
  assert.equal(page3.hasNextPage, false);
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
  assert.equal(filtered.items.length, 1);
  assert.equal(filtered.items[0]?.actorId, 'actor-a');
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
  assert.equal(filtered.items.length, 1);
  assert.equal(filtered.items[0]?.eventType, AuditEventType.TenantCreated);
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
  assert.equal(all.length, 1);
  assert.equal(all[0]?.eventType, AuditEventType.UserRegistered);
  assert.equal(all[0]?.actorId.value, 'user-42');
  assert.equal(all[0]?.metadata['email'], 'new@example.com');
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
  assert.equal(all.length, 1);
  assert.equal(all[0]?.eventType, AuditEventType.TenantCreated);
  assert.equal(all[0]?.actorId.value, 'owner-1');
  assert.equal(all[0]?.metadata['slug'], 'acme-corp');
});

test('AuditEventSubscriber ignores unknown events', async () => {
  const { repository, handler } = makeHandler();
  const subscriber = new AuditEventSubscriber(handler);

  await subscriber.handle(makeEvent('unknown.Event', { foo: 'bar' }));

  const all = await repository.findAll({}, { limit: 10, offset: 0 });
  assert.equal(all.length, 0);
});
