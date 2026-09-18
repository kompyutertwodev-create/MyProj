import type { DomainEvent } from '@workspace/kernel';
import { randomUUID } from 'node:crypto';
import type { MemberRole } from '../MemberRole.js';

export class MemberAddedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventName = 'tenant.member.added';
  readonly occurredAt: Date;
  readonly aggregateType = 'Tenant';

  constructor(
    readonly aggregateId: string,
    readonly tenantId: string,
    readonly memberId: string,
    readonly userId: string,
    readonly role: MemberRole
  ) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
  }
}
