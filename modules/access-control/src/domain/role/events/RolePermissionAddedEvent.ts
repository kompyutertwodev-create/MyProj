import { randomUUID } from 'node:crypto';
import type { DomainEvent } from '@workspace/kernel';

/** Emitted when a permission is granted to a role. */
export class RolePermissionAddedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'access-control.role.permission-added';
  readonly occurredAt: Date;
  readonly aggregateType = 'Role';

  constructor(
    readonly aggregateId: string,
    readonly tenantId: string | null,
    readonly permissionName: string,
  ) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
  }
}