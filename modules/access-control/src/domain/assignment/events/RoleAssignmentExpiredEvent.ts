import { randomUUID } from 'node:crypto';
import type { DomainEvent } from '@workspace/kernel';

/**
 * Emitted when a time-boxed role assignment passes its `expiresAt` moment
 * and is lazily marked as expired. The aggregate is not deleted — it stays
 * as an audit record with `isExpired = true`.
 */
export class RoleAssignmentExpiredEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'access-control.role-assignment.expired';
  readonly occurredAt: Date;
  readonly aggregateType = 'RoleAssignment';

  constructor(
    readonly aggregateId: string,
    readonly tenantId: string | null,
    readonly userId: string,
    readonly roleId: string,
    readonly roleName: string,
  ) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
  }
}