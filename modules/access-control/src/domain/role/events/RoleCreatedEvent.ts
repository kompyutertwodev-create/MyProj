import { randomUUID } from 'node:crypto';
import type { DomainEvent } from '@workspace/kernel';

/**
 * Emitted when a new Role aggregate is created.
 *
 * Aggregate identity travels as a plain string so subscribers in other
 * modules do not need to depend on this module's value objects.
 */
export class RoleCreatedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'access-control.role.created';
  readonly occurredAt: Date;
  readonly aggregateType = 'Role';

  constructor(
    readonly aggregateId: string,
    readonly tenantId: string | null,
    readonly name: string,
    readonly isSystem: boolean,
  ) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
  }
}