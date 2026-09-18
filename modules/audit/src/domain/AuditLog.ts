import { AggregateRoot, DomainError, Result, err, ok } from '@workspace/kernel';
import { AuditLogId } from './AuditLogId.js';
import { ActorId } from './ActorId.js';
import { TenantRef } from './TenantRef.js';
import { AuditEventType } from './AuditEventType.js';

export interface AuditLogCreateProps {
  eventType: AuditEventType;
  actorId: string;
  tenantId?: string | null;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AuditLogReconstructProps {
  id: string;
  eventType: AuditEventType;
  actorId: string;
  tenantId: string | null;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  occurredAt: Date;
}

/**
 * Aggregate Root: a single audited action.
 *
 * Audit logs are append-only. There are no lifecycle transitions:
 * once recorded, an entry is immutable.
 */
export class AuditLog extends AggregateRoot<AuditLogId> {
  private _eventType: AuditEventType;
  private _actorId: ActorId;
  private _tenantRef: TenantRef;
  private _targetType: string;
  private _targetId: string;
  private _metadata: Record<string, unknown>;
  private _ipAddress: string | null;
  private _userAgent: string | null;
  private _occurredAt: Date;

  private constructor(
    id: AuditLogId,
    eventType: AuditEventType,
    actorId: ActorId,
    tenantRef: TenantRef,
    targetType: string,
    targetId: string,
    metadata: Record<string, unknown>,
    ipAddress: string | null,
    userAgent: string | null,
    occurredAt: Date
  ) {
    super(id);
    this._eventType = eventType;
    this._actorId = actorId;
    this._tenantRef = tenantRef;
    this._targetType = targetType;
    this._targetId = targetId;
    this._metadata = metadata;
    this._ipAddress = ipAddress;
    this._userAgent = userAgent;
    this._occurredAt = occurredAt;
  }

  // --- Getters -------------------------------------------------------------

  get eventType(): AuditEventType {
    return this._eventType;
  }

  get actorId(): ActorId {
    return this._actorId;
  }

  get tenantRef(): TenantRef {
    return this._tenantRef;
  }

  get targetType(): string {
    return this._targetType;
  }

  get targetId(): string {
    return this._targetId;
  }

  get metadata(): Record<string, unknown> {
    return this._metadata;
  }

  get ipAddress(): string | null {
    return this._ipAddress;
  }

  get userAgent(): string | null {
    return this._userAgent;
  }

  get occurredAt(): Date {
    return this._occurredAt;
  }

  // --- Factory -------------------------------------------------------------

  static create(props: AuditLogCreateProps): Result<AuditLog, DomainError> {
    const actorResult = ActorId.create(props.actorId);
    if (actorResult.isErr()) {
      return err(actorResult.error);
    }

    const targetType = props.targetType?.trim();
    if (!targetType) {
      return err(new DomainError('AUDIT_TARGET_TYPE_EMPTY', 'Target type is required'));
    }

    const targetId = props.targetId?.trim();
    if (!targetId) {
      return err(new DomainError('AUDIT_TARGET_ID_EMPTY', 'Target id is required'));
    }

    const tenantRef = TenantRef.create(props.tenantId);

    return ok(
      new AuditLog(
        new AuditLogId(),
        props.eventType,
        actorResult.value,
        tenantRef,
        targetType,
        targetId,
        props.metadata ?? {},
        props.ipAddress ?? null,
        props.userAgent ?? null,
        new Date()
      )
    );
  }

  static reconstruct(props: AuditLogReconstructProps): AuditLog {
    return new AuditLog(
      new AuditLogId(props.id),
      props.eventType,
      ActorId.create(props.actorId).getOrThrow(),
      TenantRef.create(props.tenantId),
      props.targetType,
      props.targetId,
      props.metadata,
      props.ipAddress,
      props.userAgent,
      props.occurredAt
    );
  }
}
