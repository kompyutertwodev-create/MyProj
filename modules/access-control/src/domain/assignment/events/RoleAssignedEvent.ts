import { randomUUID } from 'node:crypto';
import type { DomainEvent } from '@workspace/kernel';

/**
 * Emitted when a role is granted to a subject (typically a user).
 *
 * The event carries the role *name* in addition to the id so downstream
 * consumers (audit, notification, cache invalidation) do not need to load
 * the Role aggregate just to display something meaningful.
 */
export class RoleAssignedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'access-control.role-assignment.assigned';
  readonly occurredAt: Date;
  readonly aggregateType = 'RoleAssignment';

  constructor(
    readonly aggregateId: string,
    readonly tenantId: string | null,
    readonly userId: string,
    readonly roleId: string,
    readonly roleName: string,
    readonly assignedBy: string,
    readonly expiresAt: Date | null,
  ) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
  }
}