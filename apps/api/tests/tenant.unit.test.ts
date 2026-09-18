import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CreateTenantHandler,
  GetTenantHandler,
  InMemoryMemberRepository,
  InMemoryTenantRepository,
  ListMembersHandler,
  ListTenantsHandler,
  MemberRole,
  MemberStatus,
  Tenant,
  TenantName,
  TenantSlug,
  TenantStatus,
} from '@workspace/tenant';
import type { EventBusPort } from '../../../modules/tenant/src/application/ports/EventBusPort.js';
import type { DomainEvent } from '@workspace/kernel';

/**
 * Minimal in-memory event bus for tests. Collects all published events.
 */
class FakeEventBus implements EventBusPort {
  readonly published: DomainEvent[] = [];

  async publish(event: DomainEvent): Promise<void> {
    this.published.push(event);
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    this.published.push(...events);
  }
}

function makeHandler(events: EventBusPort = new FakeEventBus()) {
  const tenants = new InMemoryTenantRepository();
  const members = new InMemoryMemberRepository();
  const handler = new CreateTenantHandler(tenants, members, events);
  return { tenants, members, handler, events };
}

// ---------------------------------------------------------------------------
// Domain-level tests
// ---------------------------------------------------------------------------

test('Tenant.create() builds an active tenant with the owner as the first member', () => {
  const name = TenantName.create('Acme Corp').getOrThrow();
  const slug = TenantSlug.create('acme-corp').getOrThrow();

  const result = Tenant.create({ name, slug, ownerUserId: 'user-1' });
  assert.equal(result.isOk(), true);

  const tenant = result.value;
  assert.equal(tenant.name.value, 'Acme Corp');
  assert.equal(tenant.slug.value, 'acme-corp');
  assert.equal(tenant.status, TenantStatus.Active);
  assert.equal(tenant.ownerUserId, 'user-1');
  assert.equal(tenant.members.length, 1);
  assert.equal(tenant.members[0]?.role, MemberRole.Owner);
  assert.equal(tenant.members[0]?.status, MemberStatus.Active);
});

test('Tenant.create() emits TenantCreated and MemberAdded domain events', () => {
  const name = TenantName.create('Event Corp').getOrThrow();
  const slug = TenantSlug.create('event-corp').getOrThrow();

  const tenant = Tenant.create({ name, slug, ownerUserId: 'user-1' }).getOrThrow();
  const events = tenant.pullDomainEvents();

  assert.equal(events.length, 2);
  assert.equal(events[0]?.eventName, 'tenant.created');
  assert.equal(events[1]?.eventName, 'tenant.member.added');
});

test('Tenant.addMember() rejects duplicate users', () => {
  const tenant = Tenant.create({
    name: TenantName.create('Duplicate Corp').getOrThrow(),
    slug: TenantSlug.create('duplicate-corp').getOrThrow(),
    ownerUserId: 'owner-1',
  }).getOrThrow();

  const duplicate = tenant.addMember(tenant.members[0]!);
  assert.equal(duplicate.isErr(), true);
  assert.equal(duplicate.error.code, 'MEMBER_ALREADY_EXISTS');
});

test('Tenant.suspend() and activate() enforce lifecycle rules', () => {
  const tenant = Tenant.create({
    name: TenantName.create('Lifecycle Corp').getOrThrow(),
    slug: TenantSlug.create('lifecycle-corp').getOrThrow(),
    ownerUserId: 'owner-1',
  }).getOrThrow();

  assert.equal(tenant.suspend('billing issue').isOk(), true);
  assert.equal(tenant.status, TenantStatus.Suspended);

  // Suspending twice fails.
  assert.equal(tenant.suspend('again').isErr(), true);

  assert.equal(tenant.activate().isOk(), true);
  assert.equal(tenant.status, TenantStatus.Active);
});

test('Tenant.removeMember() protects the owner', () => {
  const tenant = Tenant.create({
    name: TenantName.create('Owner Protect Corp').getOrThrow(),
    slug: TenantSlug.create('owner-protect-corp').getOrThrow(),
    ownerUserId: 'owner-1',
  }).getOrThrow();

  const owner = tenant.members[0]!;
  const result = tenant.removeMember(owner.id.value);
  assert.equal(result.isErr(), true);
  assert.equal(result.error.code, 'CANNOT_REMOVE_OWNER');
});

// ---------------------------------------------------------------------------
// Application-level tests (CreateTenantHandler)
// ---------------------------------------------------------------------------

test('CreateTenantHandler persists a new tenant and its owner member', async () => {
  const { tenants, members, handler } = makeHandler();

  const result = await handler.execute({
    name: 'Handler Corp',
    slug: 'handler-corp',
    ownerUserId: 'owner-42',
  });

  assert.equal(result.isOk(), true);
  const created = result.value;
  assert.equal(created.slug, 'handler-corp');
  assert.equal(created.ownerUserId, 'owner-42');

  const persisted = await tenants.findById(created.tenantId);
  assert.ok(persisted);
  assert.equal(persisted.name.value, 'Handler Corp');
  assert.equal(persisted.members.length, 1);

  const memberList = await members.findByTenantId(created.tenantId);
  assert.equal(memberList.length, 1);
  assert.equal(memberList[0]?.userId, 'owner-42');
});

test('CreateTenantHandler rejects a duplicate slug', async () => {
  const { handler } = makeHandler();

  const first = await handler.execute({
    name: 'First Corp',
    slug: 'shared-slug',
    ownerUserId: 'owner-1',
  });
  assert.equal(first.isOk(), true);

  const second = await handler.execute({
    name: 'Second Corp',
    slug: 'shared-slug',
    ownerUserId: 'owner-2',
  });
  assert.equal(second.isErr(), true);
  assert.equal(second.error.code, 'CONFLICT');
});

test('CreateTenantHandler rejects invalid slug and empty owner', async () => {
  const { handler } = makeHandler();

  const badSlug = await handler.execute({
    name: 'Bad Slug',
    slug: 'A', // too short
    ownerUserId: 'owner-1',
  });
  assert.equal(badSlug.isErr(), true);
  assert.equal(badSlug.error.code, 'VALIDATION_ERROR');

  const badOwner = await handler.execute({
    name: 'Bad Owner',
    slug: 'bad-owner',
    ownerUserId: '',
  });
  assert.equal(badOwner.isErr(), true);
  assert.equal(badOwner.error.code, 'VALIDATION_ERROR');
});

test('CreateTenantHandler publishes domain events through the event bus', async () => {
  const bus = new FakeEventBus();
  const { handler } = makeHandler(bus);

  const result = await handler.execute({
    name: 'Events Corp',
    slug: 'events-corp',
    ownerUserId: 'owner-1',
  });
  assert.equal(result.isOk(), true);
  assert.equal(bus.published.length, 2);
  assert.equal(bus.published[0]?.eventName, 'tenant.created');
  assert.equal(bus.published[1]?.eventName, 'tenant.member.added');
});

// ---------------------------------------------------------------------------
// Query tests
// ---------------------------------------------------------------------------

test('GetTenantHandler returns null for an unknown tenant', async () => {
  const tenants = new InMemoryTenantRepository();
  const handler = new GetTenantHandler(tenants);
  const result = await handler.execute({ tenantId: 'does-not-exist' });
  assert.equal(result, null);
});

test('ListTenantsHandler paginates results', async () => {
  const { tenants, handler: createHandler } = makeHandler();

  for (let index = 1; index <= 3; index += 1) {
    const result = await createHandler.execute({
      name: `Tenant ${index}`,
      slug: `tenant-${index}`,
      ownerUserId: `owner-${index}`,
    });
    assert.equal(result.isOk(), true);
  }

  const list = new ListTenantsHandler(tenants);
  const page = await list.execute({ page: 1, pageSize: 2 });
  assert.equal(page.items.length, 2);
  assert.equal(page.total, 3);
  assert.equal(page.hasNextPage, true);
  assert.equal(page.hasPreviousPage, false);

  const second = await list.execute({ page: 2, pageSize: 2 });
  assert.equal(second.items.length, 1);
  assert.equal(second.hasNextPage, false);
  assert.equal(second.hasPreviousPage, true);
});

test('ListMembersHandler returns members filtered by tenant', async () => {
  const { tenants, members, handler: createHandler } = makeHandler();

  const first = await createHandler.execute({
    name: 'Members Corp',
    slug: 'members-corp',
    ownerUserId: 'owner-a',
  });
  const second = await createHandler.execute({
    name: 'Other Corp',
    slug: 'other-corp',
    ownerUserId: 'owner-b',
  });
  assert.equal(first.isOk() && second.isOk(), true);

  const list = new ListMembersHandler(members);
  const firstMembers = await list.execute({
    tenantId: first.value.tenantId,
    page: 1,
    pageSize: 20,
  });
  assert.equal(firstMembers.length, 1);
  assert.equal(firstMembers[0]?.userId, 'owner-a');

  const secondMembers = await list.execute({
    tenantId: second.value.tenantId,
    page: 1,
    pageSize: 20,
  });
  assert.equal(secondMembers.length, 1);
  assert.equal(secondMembers[0]?.userId, 'owner-b');
});
