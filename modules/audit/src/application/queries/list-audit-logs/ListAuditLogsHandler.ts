import { paginate, type PaginatedResult } from '@workspace/kernel';
import type { AuditLogRepository } from '../../../domain/repositories/AuditLogRepository.js';
import type { ListAuditLogsQuery } from './ListAuditLogsQuery.js';
import type { AuditLogView } from '../AuditLogView.js';

export class ListAuditLogsHandler {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  async execute(query: ListAuditLogsQuery): Promise<PaginatedResult<AuditLogView>> {
    const page = Math.max(1, query.page);
    const pageSize = Math.min(100, Math.max(1, query.pageSize));
    const offset = (page - 1) * pageSize;

    const filter = {
      actorId: query.actorId,
      tenantId: query.tenantId,
      eventType: query.eventType,
      targetType: query.targetType,
      targetId: query.targetId,
      from: query.from,
      to: query.to,
    };

    const [items, total] = await Promise.all([
      this.auditLogRepository.findAll(filter, { limit: pageSize, offset }),
      this.auditLogRepository.countAll(filter),
    ]);

    const views: AuditLogView[] = items.map((log) => ({
      id: log.id.value,
      eventType: log.eventType,
      actorId: log.actorId.value,
      tenantId: log.tenantRef.value,
      targetType: log.targetType,
      targetId: log.targetId,
      metadata: log.metadata,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      occurredAt: log.occurredAt.toISOString(),
    }));

    return paginate(views, total, { page, pageSize });
  }
}
