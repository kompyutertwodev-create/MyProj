import {
  AuditEventSubscriber,
  AUDITED_EVENT_NAMES,
  DrizzleAuditLogRepository,
  ListAuditLogsHandler,
  RecordAuditHandler,
} from '@workspace/audit';
import type { PostgresDatabase, EventBus } from '@workspace/platform';
import type { DomainEvent } from '@workspace/kernel';

export interface AuditContainer {
  auditLogs: DrizzleAuditLogRepository;
  recordAudit: RecordAuditHandler;
  listAuditLogs: ListAuditLogsHandler;
  eventSubscriber: AuditEventSubscriber;
}

export interface AuditContainerOptions {
  database: PostgresDatabase;
  eventBus?: EventBus;
}

export function createAuditContainer(options: AuditContainerOptions): AuditContainer {
  const { db } = options.database;

  const auditLogs = new DrizzleAuditLogRepository(db);
  const recordAudit = new RecordAuditHandler(auditLogs);
  const listAuditLogs = new ListAuditLogsHandler(auditLogs);
  const eventSubscriber = new AuditEventSubscriber(recordAudit);

  if (options.eventBus) {
    for (const eventName of AUDITED_EVENT_NAMES) {
      options.eventBus.subscribe(eventName, {
        handle: (event: DomainEvent) => eventSubscriber.handle(event),
      });
    }
  }

  return {
    auditLogs,
    recordAudit,
    listAuditLogs,
    eventSubscriber,
  };
}
