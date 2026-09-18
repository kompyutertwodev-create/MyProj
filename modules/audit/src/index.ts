/**
 * @workspace/audit — public surface for apps/api and other modules.
 */

// HTTP router factories
export { createAuditRouter } from './presentation/index.js';
export type { AuditRouterDependencies } from './presentation/index.js';

// Application handlers
export { RecordAuditHandler } from './application/commands/record-audit/RecordAuditHandler.js';
export { ListAuditLogsHandler } from './application/queries/list-audit-logs/ListAuditLogsHandler.js';
export { AuditEventSubscriber } from './application/event-handlers/AuditEventSubscriber.js';
export { AUDITED_EVENT_NAMES } from './application/event-handlers/subscribed-events.js';
export type { AuditedEventName } from './application/event-handlers/subscribed-events.js';

// Application views (DTOs)
export type { AuditLogView } from './application/queries/AuditLogView.js';

// Domain
export { AuditLog } from './domain/AuditLog.js';
export { AuditLogId } from './domain/AuditLogId.js';
export { ActorId } from './domain/ActorId.js';
export { TenantRef } from './domain/TenantRef.js';
export { AuditEventType } from './domain/AuditEventType.js';
export { AuditRecordedEvent } from './domain/events/AuditRecordedEvent.js';
export type { AuditLogRepository, AuditLogFilter } from './domain/repositories/AuditLogRepository.js';

// Repository implementations
export { DrizzleAuditLogRepository } from './infrastructure/repositories/DrizzleAuditLogRepository.js';
export { InMemoryAuditLogRepository } from './infrastructure/repositories/InMemoryAuditLogRepository.js';

// DB schema
export { auditLogs } from './infrastructure/database/schema/index.js';
export type { AuditLogRow, AuditLogInsertRow } from './infrastructure/database/schema/index.js';
