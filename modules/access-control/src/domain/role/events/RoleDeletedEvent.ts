import { randomUUID } from 'node:crypto';
import type { DomainEvent } from '@workspace/kernel';

/**
 * Emitted when a Role is deleted.
 *
 * The Role aggregate itself performs a hard delete; this event exists so
 * downstream modules (audit, cache invalidation, cleanup of orphaned
 * assignments) can react without coupling to the repository.
 */
export class RoleDeletedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'access-control.role.deleted';
  readonly occurredAt: Date;
  readonly aggregateType = 'Role';

  constructor(
    readonly aggregateId: string,
    readonly tenantId: string | null,
    readonly name: string,
    readonly deletedBy: string,
  ) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
  }
}