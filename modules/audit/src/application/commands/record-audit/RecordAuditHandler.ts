import type { Result } from '@workspace/kernel';
import { err, ok } from '@workspace/kernel';
import { AuditLog } from '../../../domain/AuditLog.js';
import type { AuditLogRepository } from '../../../domain/repositories/AuditLogRepository.js';
import type { RecordAuditCommand } from './RecordAuditCommand.js';
import type { RecordAuditResult } from './RecordAuditResult.js';
import type { ApplicationError } from '../../ports/ApplicationError.js';
import { ValidationApplicationError, InternalApplicationError } from '../../ports/ApplicationError.js';

export class RecordAuditHandler {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  async execute(command: RecordAuditCommand): Promise<Result<RecordAuditResult, ApplicationError>> {
    const logResult = AuditLog.create({
      eventType: command.eventType,
      actorId: command.actorId,
      tenantId: command.tenantId ?? null,
      targetType: command.targetType,
      targetId: command.targetId,
      metadata: command.metadata,
      ipAddress: command.ipAddress ?? null,
      userAgent: command.userAgent ?? null,
    });

    if (logResult.isErr()) {
      return err(new ValidationApplicationError(logResult.error.message));
    }

    const log = logResult.value;

    try {
      await this.auditLogRepository.save(log);
    } catch (error) {
      return err(
        new InternalApplicationError(
          error instanceof Error ? error.message : 'Failed to persist audit log'
        )
      );
    }

    return ok({
      auditLogId: log.id.value,
      eventType: log.eventType,
      occurredAt: log.occurredAt.toISOString(),
    });
  }
}
