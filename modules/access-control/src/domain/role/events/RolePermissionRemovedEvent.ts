import { randomUUID } from 'node:crypto';
import type { DomainEvent } from '@workspace/kernel';

/** Emitted when a permission is revoked from a role. */
export class RolePermissionRemovedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'access-control.role.permission-removed';
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