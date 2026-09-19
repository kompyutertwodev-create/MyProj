import { describe, it, expect } from 'vitest';
import { Policy } from '../Policy.js';
import { PolicyId } from '../PolicyId.js';
import { PolicyEffect } from '../PolicyEffect.js';
import type { AttributeCondition } from '../AttributeCondition.js';
import { PolicyDeletedEvent } from '../events/PolicyDeletedEvent.js';
import { PolicyCreatedEvent } from '../events/PolicyCreatedEvent.js';

describe('Policy', () => {
  it('create() builds an active policy with PolicyCreatedEvent', () => {
    const result = Policy.create({
      name: 'Admin Policy',
      description: 'Admin access',
      effect: PolicyEffect.Allow,
      subjects: ['role:admin'],
      resources: ['*'],
      actions: ['*'],
      createdBy: 'user-123',
    });

    expect(result.isOk()).toBe(true);
    const policy = result.getOrThrow();
    expect(policy.name).toBe('Admin Policy');
    expect(policy.description).toBe('Admin access');
    expect(policy.effect).toBe(PolicyEffect.Allow);
    expect(policy.subjects.length).toBe(1);
    expect(policy.subjects[0]).toBe('role:admin');
    expect(policy.resources.length).toBe(1);
    expect(policy.resources[0]).toBe('*');
    expect(policy.actions.length).toBe(1);
    expect(policy.actions[0]).toBe('*');
    expect(policy.conditions.length).toBe(0);
    expect(policy.priority).toBe(100);
    expect(policy.isActive).toBe(true);
    expect(policy.isDeleted).toBe(false);
    expect(policy.createdBy).toBe('user-123');
    expect(policy.tenantId).toBe(null);
    expect(policy.version).toBe(1);

    const events = policy.pullDomainEvents();
    expect(events.length).toBe(1);
    expect(events[0].eventName).toBe('access-control.policy.created');
    const createdEvent = events[0] as PolicyCreatedEvent;
    expect(createdEvent.name).toBe('Admin Policy');
    expect(createdEvent.effect).toBe(PolicyEffect.Allow);
  });

  it('create() validates name length', () => {
    const result = Policy.create({
      name: 'a'.repeat(201),
      effect: PolicyEffect.Allow,
      subjects: ['role:admin'],
      resources: ['*'],
      actions: ['*'],
      createdBy: 'user-123',
    });

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('POLICY_NAME_TOO_LONG');
  });

  it('create() validates description length', () => {
    const result = Policy.create({
      name: 'Policy',
      description: 'a'.repeat(1001),
      effect: PolicyEffect.Allow,
      subjects: ['role:admin'],
      resources: ['*'],
      actions: ['*'],
      createdBy: 'user-123',
    });

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('POLICY_DESCRIPTION_TOO_LONG');
  });

  it('create() validates createdBy', () => {
    const result = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['role:admin'],
      resources: ['*'],
      actions: ['*'],
      createdBy: '',
    });

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('POLICY_CREATED_BY_EMPTY');
  });

  it('create() validates subjects not empty', () => {
    const result = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: [],
      resources: ['*'],
      actions: ['*'],
      createdBy: 'user-123',
    });

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('POLICY_SUBJECTS_EMPTY');
  });

  it('create() validates resources not empty', () => {
    const result = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['role:admin'],
      resources: [],
      actions: ['*'],
      createdBy: 'user-123',
    });

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('POLICY_RESOURCES_EMPTY');
  });

  it('create() validates actions not empty', () => {
    const result = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['role:admin'],
      resources: ['*'],
      actions: [],
      createdBy: 'user-123',
    });

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('POLICY_ACTIONS_EMPTY');
  });

  it('create() normalizes and deduplicates lists', () => {
    const result = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: [' role:admin ', 'role:admin', ' role:user '],
      resources: ['tenant:*', 'tenant:*'],
      actions: ['create', 'read', 'create'],
      createdBy: 'user-123',
    });

    expect(result.isOk()).toBe(true);
    const policy = result.getOrThrow();
    expect(policy.subjects.length).toBe(2);
    expect(policy.resources.length).toBe(1);
    expect(policy.actions.length).toBe(2);
  });

  it('create() accepts conditions', () => {
    const conditions: AttributeCondition[] = [
      { attribute: 'resource.ownerId', operator: 'eq', value: '${subject.id}' },
    ];
    const result = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['role:admin'],
      resources: ['*'],
      actions: ['*'],
      conditions,
      createdBy: 'user-123',
    });

    expect(result.isOk()).toBe(true);
    const policy = result.getOrThrow();
    expect(policy.conditions.length).toBe(1);
  });

  it('create() accepts custom priority', () => {
    const result = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['role:admin'],
      resources: ['*'],
      actions: ['*'],
      priority: 500,
      createdBy: 'user-123',
    });

    expect(result.isOk()).toBe(true);
    const policy = result.getOrThrow();
    expect(policy.priority).toBe(500);
  });

  it('create() accepts inactive', () => {
    const result = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['role:admin'],
      resources: ['*'],
      actions: ['*'],
      isActive: false,
      createdBy: 'user-123',
    });

    expect(result.isOk()).toBe(true);
    const policy = result.getOrThrow();
    expect(policy.isActive).toBe(false);
  });

  it('create() accepts tenantId', () => {
    const result = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['role:admin'],
      resources: ['*'],
      actions: ['*'],
      tenantId: 'tenant-123',
      createdBy: 'user-123',
    });

    expect(result.isOk()).toBe(true);
    const policy = result.getOrThrow();
    expect(policy.tenantId).toBe('tenant-123');
  });

  it('reconstruct() rebuilds from persistence', () => {
    const props = {
      id: new PolicyId(),
      name: 'Policy',
      description: 'Desc',
      effect: PolicyEffect.Allow,
      subjects: ['role:admin'],
      resources: ['*'],
      actions: ['*'],
      conditions: [],
      priority: 100,
      isActive: true,
      isDeleted: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      createdBy: 'user-123',
      tenantId: 'tenant-123',
      version: 5,
    };

    const policy = Policy.reconstruct(props);

    expect(policy.id.value).toBe(props.id.value);
    expect(policy.name).toBe('Policy');
    expect(policy.effect).toBe(PolicyEffect.Allow);
    expect(policy.version).toBe(5);
  });

  it('evaluate() returns null for inactive policy', () => {
    const policy = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['role:admin'],
      resources: ['*'],
      actions: ['*'],
      isActive: false,
      createdBy: 'user-123',
    }).getOrThrow();

    const result = policy.evaluate(['role:admin'], 'tenant:123', 'create', {});

    expect(result).toBe(null);
  });

  it('evaluate() returns null for deleted policy', () => {
    const policy = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['role:admin'],
      resources: ['*'],
      actions: ['*'],
      createdBy: 'user-123',
    }).getOrThrow();
    policy.delete('user-123');

    const result = policy.evaluate(['role:admin'], 'tenant:123', 'create', {});

    expect(result).toBe(null);
  });

  it('evaluate() returns null if subject does not match', () => {
    const policy = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['role:admin'],
      resources: ['*'],
      actions: ['*'],
      createdBy: 'user-123',
    }).getOrThrow();

    const result = policy.evaluate(['role:user'], 'tenant:123', 'create', {});

    expect(result).toBe(null);
  });

  it('evaluate() matches subject with wildcard', () => {
    const policy = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['*'],
      resources: ['*'],
      actions: ['*'],
      createdBy: 'user-123',
    }).getOrThrow();

    const result = policy.evaluate(['role:user'], 'tenant:123', 'create', {});

    expect(result).toBe(PolicyEffect.Allow);
  });

  it('evaluate() returns null if resource does not match', () => {
    const policy = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['*'],
      resources: ['tenant:*'],
      actions: ['*'],
      createdBy: 'user-123',
    }).getOrThrow();

    const result = policy.evaluate(['role:user'], 'user:123', 'create', {});

    expect(result).toBe(null);
  });

  it('evaluate() matches resource with wildcard', () => {
    const policy = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['*'],
      resources: ['*'],
      actions: ['*'],
      createdBy: 'user-123',
    }).getOrThrow();

    const result = policy.evaluate(['role:user'], 'user:123', 'create', {});

    expect(result).toBe(PolicyEffect.Allow);
  });

  it('evaluate() returns null if action does not match', () => {
    const policy = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['*'],
      resources: ['*'],
      actions: ['create'],
      createdBy: 'user-123',
    }).getOrThrow();

    const result = policy.evaluate(['role:user'], 'tenant:123', 'read', {});

    expect(result).toBe(null);
  });

  it('evaluate() matches action with wildcard', () => {
    const policy = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['*'],
      resources: ['*'],
      actions: ['*'],
      createdBy: 'user-123',
    }).getOrThrow();

    const result = policy.evaluate(['role:user'], 'tenant:123', 'read', {});

    expect(result).toBe(PolicyEffect.Allow);
  });

  it('evaluate() returns null if conditions fail', () => {
    const conditions: AttributeCondition[] = [
      { attribute: 'resource.ownerId', operator: 'eq', value: '${subject.id}' },
    ];
    const policy = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['*'],
      resources: ['*'],
      actions: ['*'],
      conditions,
      createdBy: 'user-123',
    }).getOrThrow();

    const context = {
      subject: { id: 'user-1' },
      resource: { ownerId: 'user-2' },
    };

    const result = policy.evaluate(['role:user'], 'tenant:123', 'create', context);

    expect(result).toBe(null);
  });

  it('evaluate() returns effect if all conditions pass', () => {
    const conditions: AttributeCondition[] = [
      { attribute: 'resource.ownerId', operator: 'eq', value: '${subject.id}' },
    ];
    const policy = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['*'],
      resources: ['*'],
      actions: ['*'],
      conditions,
      createdBy: 'user-123',
    }).getOrThrow();

    const context = {
      subject: { id: 'user-1' },
      resource: { ownerId: 'user-1' },
    };

    const result = policy.evaluate(['role:user'], 'tenant:123', 'create', context);

    expect(result).toBe(PolicyEffect.Allow);
  });

  it('activate() marks as active and emits PolicyActivatedEvent', () => {
    const policy = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['*'],
      resources: ['*'],
      actions: ['*'],
      isActive: false,
      createdBy: 'user-123',
    }).getOrThrow();
    policy.pullDomainEvents();

    const result = policy.activate();

    expect(result.isOk()).toBe(true);
    expect(policy.isActive).toBe(true);

    const events = policy.pullDomainEvents();
    expect(events.length).toBe(1);
    expect(events[0].eventName).toBe('access-control.policy.activated');
  });

  it('activate() rejects already active', () => {
    const policy = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['*'],
      resources: ['*'],
      actions: ['*'],
      createdBy: 'user-123',
    }).getOrThrow();

    const result = policy.activate();

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('POLICY_ALREADY_ACTIVE');
  });

  it('activate() rejects deleted policy', () => {
    const policy = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['*'],
      resources: ['*'],
      actions: ['*'],
      isActive: false,
      createdBy: 'user-123',
    }).getOrThrow();
    policy.delete('user-123');

    const result = policy.activate();

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('POLICY_DELETED');
  });

  it('deactivate() marks as inactive and emits PolicyDeactivatedEvent', () => {
    const policy = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['*'],
      resources: ['*'],
      actions: ['*'],
      createdBy: 'user-123',
    }).getOrThrow();
    policy.pullDomainEvents();

    const result = policy.deactivate();

    expect(result.isOk()).toBe(true);
    expect(policy.isActive).toBe(false);

    const events = policy.pullDomainEvents();
    expect(events.length).toBe(1);
    expect(events[0].eventName).toBe('access-control.policy.deactivated');
  });

  it('deactivate() rejects already inactive', () => {
    const policy = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['*'],
      resources: ['*'],
      actions: ['*'],
      isActive: false,
      createdBy: 'user-123',
    }).getOrThrow();

    const result = policy.deactivate();

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('POLICY_ALREADY_INACTIVE');
  });

  it('deactivate() rejects deleted policy', () => {
    const policy = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['*'],
      resources: ['*'],
      actions: ['*'],
      createdBy: 'user-123',
    }).getOrThrow();
    policy.delete('user-123');

    const result = policy.deactivate();

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('POLICY_DELETED');
  });

  it('delete() marks as deleted and emits PolicyDeletedEvent', () => {
    const policy = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['*'],
      resources: ['*'],
      actions: ['*'],
      createdBy: 'user-123',
    }).getOrThrow();
    policy.pullDomainEvents();

    const result = policy.delete('user-456');

    expect(result.isOk()).toBe(true);
    expect(policy.isDeleted).toBe(true);
    expect(policy.isActive).toBe(false);

    const events = policy.pullDomainEvents();
    expect(events.length).toBe(1);
    expect(events[0].eventName).toBe('access-control.policy.deleted');
    const deletedEvent = events[0] as PolicyDeletedEvent;
    expect(deletedEvent.deletedBy).toBe('user-456');
  });

  it('delete() rejects already deleted', () => {
    const policy = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['*'],
      resources: ['*'],
      actions: ['*'],
      createdBy: 'user-123',
    }).getOrThrow();
    policy.delete('user-123');

    const result = policy.delete('user-456');

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('POLICY_ALREADY_DELETED');
  });

  it('delete() rejects empty deletedBy', () => {
    const policy = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['*'],
      resources: ['*'],
      actions: ['*'],
      createdBy: 'user-123',
    }).getOrThrow();

    const result = policy.delete('');

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('POLICY_DELETED_BY_EMPTY');
  });

  it('updateName() changes name and emits PolicyUpdatedEvent', () => {
    const policy = Policy.create({
      name: 'Old Name',
      effect: PolicyEffect.Allow,
      subjects: ['*'],
      resources: ['*'],
      actions: ['*'],
      createdBy: 'user-123',
    }).getOrThrow();
    policy.pullDomainEvents();

    const result = policy.updateName('New Name');

    expect(result.isOk()).toBe(true);
    expect(policy.name).toBe('New Name');

    const events = policy.pullDomainEvents();
    expect(events.length).toBe(1);
    expect(events[0].eventName).toBe('access-control.policy.updated');
  });

  it('updateName() rejects deleted policy', () => {
    const policy = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['*'],
      resources: ['*'],
      actions: ['*'],
      createdBy: 'user-123',
    }).getOrThrow();
    policy.delete('user-123');

    const result = policy.updateName('New Name');

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('POLICY_DELETED');
  });

  it('updateName() validates length', () => {
    const policy = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['*'],
      resources: ['*'],
      actions: ['*'],
      createdBy: 'user-123',
    }).getOrThrow();

    const result = policy.updateName('a'.repeat(201));

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('POLICY_NAME_TOO_LONG');
  });

  it('updateName() rejects unchanged name', () => {
    const policy = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['*'],
      resources: ['*'],
      actions: ['*'],
      createdBy: 'user-123',
    }).getOrThrow();

    const result = policy.updateName('Policy');

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('POLICY_NAME_UNCHANGED');
  });

  it('updateDescription() changes description and emits PolicyUpdatedEvent', () => {
    const policy = Policy.create({
      name: 'Policy',
      description: 'Old',
      effect: PolicyEffect.Allow,
      subjects: ['*'],
      resources: ['*'],
      actions: ['*'],
      createdBy: 'user-123',
    }).getOrThrow();
    policy.pullDomainEvents();

    const result = policy.updateDescription('New');

    expect(result.isOk()).toBe(true);
    expect(policy.description).toBe('New');

    const events = policy.pullDomainEvents();
    expect(events.length).toBe(1);
  });

  it('updateDescription() validates length', () => {
    const policy = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['*'],
      resources: ['*'],
      actions: ['*'],
      createdBy: 'user-123',
    }).getOrThrow();

    const result = policy.updateDescription('a'.repeat(1001));

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('POLICY_DESCRIPTION_TOO_LONG');
  });

  it('updateDescription() rejects unchanged description', () => {
    const policy = Policy.create({
      name: 'Policy',
      description: 'Same',
      effect: PolicyEffect.Allow,
      subjects: ['*'],
      resources: ['*'],
      actions: ['*'],
      createdBy: 'user-123',
    }).getOrThrow();

    const result = policy.updateDescription('Same');

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('POLICY_DESCRIPTION_UNCHANGED');
  });

  it('updateEffect() changes effect and emits PolicyUpdatedEvent', () => {
    const policy = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['*'],
      resources: ['*'],
      actions: ['*'],
      createdBy: 'user-123',
    }).getOrThrow();
    policy.pullDomainEvents();

    const result = policy.updateEffect(PolicyEffect.Deny);

    expect(result.isOk()).toBe(true);
    expect(policy.effect).toBe(PolicyEffect.Deny);

    const events = policy.pullDomainEvents();
    expect(events.length).toBe(1);
  });

  it('updateEffect() rejects unchanged effect', () => {
    const policy = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['*'],
      resources: ['*'],
      actions: ['*'],
      createdBy: 'user-123',
    }).getOrThrow();

    const result = policy.updateEffect(PolicyEffect.Allow);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('POLICY_EFFECT_UNCHANGED');
  });

  it('updateSubjects() changes subjects and emits PolicyUpdatedEvent', () => {
    const policy = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['role:admin'],
      resources: ['*'],
      actions: ['*'],
      createdBy: 'user-123',
    }).getOrThrow();
    policy.pullDomainEvents();

    const result = policy.updateSubjects(['role:user']);

    expect(result.isOk()).toBe(true);
    expect(policy.subjects.length).toBe(1);
    expect(policy.subjects[0]).toBe('role:user');

    const events = policy.pullDomainEvents();
    expect(events.length).toBe(1);
  });

  it('updateSubjects() validates not empty', () => {
    const policy = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['role:admin'],
      resources: ['*'],
      actions: ['*'],
      createdBy: 'user-123',
    }).getOrThrow();

    const result = policy.updateSubjects([]);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('POLICY_SUBJECTS_EMPTY');
  });

  it('updateResources() changes resources and emits PolicyUpdatedEvent', () => {
    const policy = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['*'],
      resources: ['tenant:*'],
      actions: ['*'],
      createdBy: 'user-123',
    }).getOrThrow();
    policy.pullDomainEvents();

    const result = policy.updateResources(['user:*']);

    expect(result.isOk()).toBe(true);
    expect(policy.resources.length).toBe(1);
    expect(policy.resources[0]).toBe('user:*');

    const events = policy.pullDomainEvents();
    expect(events.length).toBe(1);
  });

  it('updateResources() validates not empty', () => {
    const policy = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['*'],
      resources: ['tenant:*'],
      actions: ['*'],
      createdBy: 'user-123',
    }).getOrThrow();

    const result = policy.updateResources([]);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('POLICY_RESOURCES_EMPTY');
  });

  it('updateActions() changes actions and emits PolicyUpdatedEvent', () => {
    const policy = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['*'],
      resources: ['*'],
      actions: ['create'],
      createdBy: 'user-123',
    }).getOrThrow();
    policy.pullDomainEvents();

    const result = policy.updateActions(['read']);

    expect(result.isOk()).toBe(true);
    expect(policy.actions.length).toBe(1);
    expect(policy.actions[0]).toBe('read');

    const events = policy.pullDomainEvents();
    expect(events.length).toBe(1);
  });

  it('updateActions() validates not empty', () => {
    const policy = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['*'],
      resources: ['*'],
      actions: ['create'],
      createdBy: 'user-123',
    }).getOrThrow();

    const result = policy.updateActions([]);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('POLICY_ACTIONS_EMPTY');
  });

  it('updateConditions() changes conditions and emits PolicyUpdatedEvent', () => {
    const policy = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['*'],
      resources: ['*'],
      actions: ['*'],
      createdBy: 'user-123',
    }).getOrThrow();
    policy.pullDomainEvents();

    const conditions: AttributeCondition[] = [
      { attribute: 'resource.ownerId', operator: 'eq', value: '${subject.id}' },
    ];
    const result = policy.updateConditions(conditions);

    expect(result.isOk()).toBe(true);
    expect(policy.conditions.length).toBe(1);

    const events = policy.pullDomainEvents();
    expect(events.length).toBe(1);
  });

  it('updatePriority() changes priority and emits PolicyUpdatedEvent', () => {
    const policy = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['*'],
      resources: ['*'],
      actions: ['*'],
      createdBy: 'user-123',
    }).getOrThrow();
    policy.pullDomainEvents();

    const result = policy.updatePriority(500);

    expect(result.isOk()).toBe(true);
    expect(policy.priority).toBe(500);

    const events = policy.pullDomainEvents();
    expect(events.length).toBe(1);
  });

  it('updatePriority() validates range', () => {
    const policy = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['*'],
      resources: ['*'],
      actions: ['*'],
      createdBy: 'user-123',
    }).getOrThrow();

    const result = policy.updatePriority(-1);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('POLICY_PRIORITY_INVALID');
  });

  it('updatePriority() rejects unchanged priority', () => {
    const policy = Policy.create({
      name: 'Policy',
      effect: PolicyEffect.Allow,
      subjects: ['*'],
      resources: ['*'],
      actions: ['*'],
      createdBy: 'user-123',
    }).getOrThrow();

    const result = policy.updatePriority(100);

    expect(result.isErr()).toBe(true);
    expect((result as any).error.code).toBe('POLICY_PRIORITY_UNCHANGED');
  });
});
