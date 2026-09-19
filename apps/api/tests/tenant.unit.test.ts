import { expect, test } from 'vitest';
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
  expect(result.isOk()).toBe(true);

  const tenant = result.value;
  expect(tenant.name.value).toBe('Acme Corp');
  expect(tenant.slug.value).toBe('acme-corp');
  expect(tenant.status).toBe(TenantStatus.Active);
  expect(tenant.ownerUserId).toBe('user-1');
  expect(tenant.members.length).toBe(1);
  expect(tenant.members[0]?.role).toBe(MemberRole.Owner);
  expect(tenant.members[0]?.status).toBe(MemberStatus.Active);
});

test('Tenant.create() emits TenantCreated and MemberAdded domain events', () => {
  const name = TenantName.create('Event Corp').getOrThrow();
  const slug = TenantSlug.create('event-corp').getOrThrow();

  const tenant = Tenant.create({ name, slug, ownerUserId: 'user-1' }).getOrThrow();
  const events = tenant.pullDomainEvents();

  expect(events.length).toBe(2);
  expect(events[0]?.eventName).toBe('tenant.created');
  expect(events[1]?.eventName).toBe('tenant.member.added');
});

test('Tenant.addMember() rejects duplicate users', () => {
  const tenant = Tenant.create({
    name: TenantName.create('Duplicate Corp').getOrThrow(),
    slug: TenantSlug.create('duplicate-corp').getOrThrow(),
    ownerUserId: 'owner-1',
  }).getOrThrow();

  const duplicate = tenant.addMember(tenant.members[0]!);
  expect(duplicate.isErr()).toBe(true);
  expect(duplicate.error.code).toBe('MEMBER_ALREADY_EXISTS');
});

test('Tenant.suspend() and activate() enforce lifecycle rules', () => {
  const tenant = Tenant.create({
    name: TenantName.create('Lifecycle Corp').getOrThrow(),
    slug: TenantSlug.create('lifecycle-corp').getOrThrow(),
    ownerUserId: 'owner-1',
  }).getOrThrow();

  expect(tenant.suspend('billing issue').isOk()).toBe(true);
  expect(tenant.status).toBe(TenantStatus.Suspended);

  // Suspending twice fails.
  expect(tenant.suspend('again').isErr()).toBe(true);

  expect(tenant.activate().isOk()).toBe(true);
  expect(tenant.status).toBe(TenantStatus.Active);
});

test('Tenant.removeMember() protects the owner', () => {
  const tenant = Tenant.create({
    name: TenantName.create('Owner Protect Corp').getOrThrow(),
    slug: TenantSlug.create('owner-protect-corp').getOrThrow(),
    ownerUserId: 'owner-1',
  }).getOrThrow();

  const owner = tenant.members[0]!;
  const result = tenant.removeMember(owner.id.value);
  expect(result.isErr()).toBe(true);
  expect(result.error.code).toBe('CANNOT_REMOVE_OWNER');
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

  expect(result.isOk()).toBe(true);
  const created = result.value;
  expect(created.slug).toBe('handler-corp');
  expect(created.ownerUserId).toBe('owner-42');

  const persisted = await tenants.findById(created.tenantId);
  expect(persisted).toBeTruthy();
  expect(persisted!.name.value).toBe('Handler Corp');
  expect(persisted!.members.length).toBe(1);

  const memberList = await members.findByTenantId(created.tenantId);
  expect(memberList.length).toBe(1);
  expect(memberList[0]?.userId).toBe('owner-42');
});

test('CreateTenantHandler rejects a duplicate slug', async () => {
  const { handler } = makeHandler();

  const first = await handler.execute({
    name: 'First Corp',
    slug: 'shared-slug',
    ownerUserId: 'owner-1',
  });
  expect(first.isOk()).toBe(true);

  const second = await handler.execute({
    name: 'Second Corp',
    slug: 'shared-slug',
    ownerUserId: 'owner-2',
  });
  expect(second.isErr()).toBe(true);
  expect(second.error.code).toBe('CONFLICT');
});

test('CreateTenantHandler rejects invalid slug and empty owner', async () => {
  const { handler } = makeHandler();

  const badSlug = await handler.execute({
    name: 'Bad Slug',
    slug: 'A', // too short
    ownerUserId: 'owner-1',
  });
  expect(badSlug.isErr()).toBe(true);
  expect(badSlug.error.code).toBe('VALIDATION_ERROR');

  const badOwner = await handler.execute({
    name: 'Bad Owner',
    slug: 'bad-owner',
    ownerUserId: '',
  });
  expect(badOwner.isErr()).toBe(true);
  expect(badOwner.error.code).toBe('VALIDATION_ERROR');
});

test('CreateTenantHandler publishes domain events through the event bus', async () => {
  const bus = new FakeEventBus();
  const { handler } = makeHandler(bus);

  const result = await handler.execute({
    name: 'Events Corp',
    slug: 'events-corp',
    ownerUserId: 'owner-1',
  });
  expect(result.isOk()).toBe(true);
  expect(bus.published.length).toBe(2);
  expect(bus.published[0]?.eventName).toBe('tenant.created');
  expect(bus.published[1]?.eventName).toBe('tenant.member.added');
});

// ---------------------------------------------------------------------------
// Query tests
// ---------------------------------------------------------------------------

test('GetTenantHandler returns null for an unknown tenant', async () => {
  const tenants = new InMemoryTenantRepository();
  const handler = new GetTenantHandler(tenants);
  const result = await handler.execute({ tenantId: 'does-not-exist' });
  expect(result).toBeNull();
});

test('ListTenantsHandler paginates results', async () => {
  const { tenants, handler: createHandler } = makeHandler();

  for (let index = 1; index <= 3; index += 1) {
    const result = await createHandler.execute({
      name: `Tenant ${index}`,
      slug: `tenant-${index}`,
      ownerUserId: `owner-${index}`,
    });
    expect(result.isOk()).toBe(true);
  }

  const list = new ListTenantsHandler(tenants);
  const page = await list.execute({ page: 1, pageSize: 2 });
  expect(page.items.length).toBe(2);
  expect(page.total).toBe(3);
  expect(page.hasNextPage).toBe(true);
  expect(page.hasPreviousPage).toBe(false);

  const second = await list.execute({ page: 2, pageSize: 2 });
  expect(second.items.length).toBe(1);
  expect(second.hasNextPage).toBe(false);
  expect(second.hasPreviousPage).toBe(true);
});

test('ListMembersHandler returns members filtered by tenant', async () => {
  const { members, handler: createHandler } = makeHandler();

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
  expect(first.isOk() && second.isOk()).toBe(true);

  const list = new ListMembersHandler(members);
  const firstMembers = await list.execute({
    tenantId: first.value.tenantId,
    page: 1,
    pageSize: 20,
  });
  expect(firstMembers.length).toBe(1);
  expect(firstMembers[0]?.userId).toBe('owner-a');

  const secondMembers = await list.execute({
    tenantId: second.value.tenantId,
    page: 1,
    pageSize: 20,
  });
  expect(secondMembers.length).toBe(1);
  expect(secondMembers[0]?.userId).toBe('owner-b');
});