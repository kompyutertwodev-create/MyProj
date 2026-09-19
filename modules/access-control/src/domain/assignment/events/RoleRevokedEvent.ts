import { randomUUID } from 'node:crypto';
import type { DomainEvent } from '@workspace/kernel';

/** Emitted when a role assignment is explicitly revoked. */
export class RoleRevokedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'access-control.role-assignment.revoked';
  readonly occurredAt: Date;
  readonly aggregateType = 'RoleAssignment';

  constructor(
    readonly aggregateId: string,
    readonly tenantId: string | null,
    readonly userId: string,
    readonly roleId: string,
    readonly roleName: string,
    readonly revokedBy: string,
    readonly reason: string | null,
  ) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
  }
}