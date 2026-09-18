import type { DomainEvent } from '@workspace/kernel';
import type { EventHandler } from '@workspace/platform';
import { AuditEventType } from '../../domain/AuditEventType.js';
import type { RecordAuditHandler } from '../commands/record-audit/RecordAuditHandler.js';

export class AuditEventSubscriber implements EventHandler {
  constructor(private readonly recordAudit: RecordAuditHandler) {}

  async handle(event: DomainEvent): Promise<void> {
    const mapping = this.mapEvent(event);
    if (!mapping) return;

    await this.recordAudit.execute({
      eventType: mapping.eventType,
      actorId: mapping.actorId,
      tenantId: mapping.tenantId,
      targetType: mapping.targetType,
      targetId: mapping.targetId,
      metadata: mapping.metadata,
    });
  }

  private mapEvent(event: DomainEvent): {
    eventType: AuditEventType;
    actorId: string;
    tenantId: string | null;
    targetType: string;
    targetId: string;
    metadata: Record<string, unknown>;
  } | null {
    const payload = event as unknown as Record<string, unknown>;

    switch (event.eventName) {
      case 'iam.UserRegistered':
        return {
          eventType: AuditEventType.UserRegistered,
          actorId: String(payload['userId'] ?? event.aggregateId),
          tenantId: null,
          targetType: 'User',
          targetId: String(payload['userId'] ?? event.aggregateId),
          metadata: { email: payload['email'], displayName: payload['displayName'] },
        };

      case 'iam.UserLoggedIn':
        return {
          eventType: AuditEventType.UserLoggedIn,
          actorId: String(payload['userId'] ?? event.aggregateId),
          tenantId: null,
          targetType: 'User',
          targetId: String(payload['userId'] ?? event.aggregateId),
          metadata: { sessionId: payload['sessionId'], ipAddress: payload['ipAddress'] },
        };

      case 'iam.UserLoggedOut':
        return {
          eventType: AuditEventType.UserLoggedOut,
          actorId: String(payload['userId'] ?? event.aggregateId),
          tenantId: null,
          targetType: 'User',
          targetId: String(payload['userId'] ?? event.aggregateId),
          metadata: { sessionId: payload['sessionId'] },
        };

      case 'tenant.created':
        return {
          eventType: AuditEventType.TenantCreated,
          actorId: String(payload['ownerUserId'] ?? 'system'),
          tenantId: String(event.aggregateId),
          targetType: 'Tenant',
          targetId: String(event.aggregateId),
          metadata: { name: payload['name'], slug: payload['slug'] },
        };

      case 'tenant.member.added':
        return {
          eventType: AuditEventType.MemberAdded,
          actorId: String(payload['userId'] ?? 'system'),
          tenantId: String(payload['tenantId'] ?? event.aggregateId),
          targetType: 'Member',
          targetId: String(payload['memberId'] ?? event.aggregateId),
          metadata: { role: payload['role'] },
        };

      default:
        return null;
    }
  }
}
