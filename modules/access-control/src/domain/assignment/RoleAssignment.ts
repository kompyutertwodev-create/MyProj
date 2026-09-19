import { AggregateRoot, DomainError, Result, ok, err } from '@workspace/kernel';
import { RoleAssignmentId } from './RoleAssignmentId.js';
import {
  RoleAssignedEvent,
  RoleRevokedEvent,
  RoleAssignmentExpiredEvent,
} from './events/index.js';

/** Input for {@link RoleAssignment.create}. */
export interface RoleAssignmentCreateProps {
  userId: string;
  roleId: string;
  roleName: string;
  assignedBy: string;
  tenantId?: string | null;
  /** Optional time-box; `null` means the assignment never expires. */
  expiresAt?: Date | null;
}

/** Input for {@link RoleAssignment.reconstruct}. */
export interface RoleAssignmentReconstructProps {
  id: RoleAssignmentId;
  userId: string;
  roleId: string;
  roleName: string;
  tenantId: string | null;
  assignedBy: string;
  assignedAt: Date;
  expiresAt: Date | null;
  revokedAt: Date | null;
  revokedBy: string | null;
  revokedReason: string | null;
  isExpired: boolean;
  createdAt: Date;
  updatedAt: Date;
  version?: number;
}

const REASON_MAX = 500;

/**
 * RoleAssignment aggregate root.
 *
 * Represents the fact that a subject (typically a user) has been granted a
 * specific role. This is deliberately modeled as its own aggregate — rather
 * than as a collection inside User or Role — so that:
 *
 *   - every grant carries its own audit trail (`assignedBy`, `assignedAt`,
 *     `expiresAt`, `revokedBy`, `revokedReason`);
 *   - time-boxed grants can expire lazily without touching the user;
 *   - the access-control module remains independent of the iam module
 *     (it references users by id only).
 *
 * Revocation is soft: the row stays in the database and `isActive()` starts
 * returning `false`, preserving history for audit and policy evaluation.
 */
export class RoleAssignment extends AggregateRoot<RoleAssignmentId> {
  private readonly _userId: string;
  private readonly _roleId: string;
  private readonly _roleName: string;
  private readonly _tenantId: string | null;
  private readonly _assignedBy: string;
  private readonly _assignedAt: Date;
  private readonly _expiresAt: Date | null;
  private _revokedAt: Date | null;
  private _revokedBy: string | null;
  private _revokedReason: string | null;
  private _isExpired: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: RoleAssignmentId,
    props: {
      userId: string;
      roleId: string;
      roleName: string;
      tenantId: string | null;
      assignedBy: string;
      assignedAt: Date;
      expiresAt: Date | null;
      revokedAt: Date | null;
      revokedBy: string | null;
      revokedReason: string | null;
      isExpired: boolean;
      createdAt: Date;
      updatedAt: Date;
      version: number;
    },
  ) {
    super(id, props.version);
    this._userId = props.userId;
    this._roleId = props.roleId;
    this._roleName = props.roleName;
    this._tenantId = props.tenantId;
    this._assignedBy = props.assignedBy;
    this._assignedAt = props.assignedAt;
    this._expiresAt = props.expiresAt;
    this._revokedAt = props.revokedAt;
    this._revokedBy = props.revokedBy;
    this._revokedReason = props.revokedReason;
    this._isExpired = props.isExpired;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  // ─── Getters ──────────────────────────────────────────────────────────────

  get userId(): string {
    return this._userId;
  }
  get roleId(): string {
    return this._roleId;
  }
  get roleName(): string {
    return this._roleName;
  }
  get tenantId(): string | null {
    return this._tenantId;
  }
  get assignedBy(): string {
    return this._assignedBy;
  }
  get assignedAt(): Date {
    return this._assignedAt;
  }
  get expiresAt(): Date | null {
    return this._expiresAt;
  }
  get revokedAt(): Date | null {
    return this._revokedAt;
  }
  get revokedBy(): string | null {
    return this._revokedBy;
  }
  get revokedReason(): string | null {
    return this._revokedReason;
  }
  get isExpired(): boolean {
    return this._isExpired;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ─── Factory ──────────────────────────────────────────────────────────────

  static create(props: RoleAssignmentCreateProps): Result<RoleAssignment, DomainError> {
    const userId = (props.userId ?? '').trim();
    if (userId.length === 0) {
      return err(
        new DomainError('ROLE_ASSIGNMENT_USER_EMPTY', 'RoleAssignment userId is required'),
      );
    }

    const roleId = (props.roleId ?? '').trim();
    if (roleId.length === 0) {
      return err(
        new DomainError('ROLE_ASSIGNMENT_ROLE_EMPTY', 'RoleAssignment roleId is required'),
      );
    }

    const roleName = (props.roleName ?? '').trim().toLowerCase();
    if (roleName.length === 0) {
      return err(
        new DomainError(
          'ROLE_ASSIGNMENT_ROLE_NAME_EMPTY',
          'RoleAssignment roleName is required',
        ),
      );
    }

    const assignedBy = (props.assignedBy ?? '').trim();
    if (assignedBy.length === 0) {
      return err(
        new DomainError(
          'ROLE_ASSIGNMENT_ASSIGNED_BY_EMPTY',
          'RoleAssignment assignedBy is required',
        ),
      );
    }

    const now = new Date();
    const expiresAt = props.expiresAt ?? null;
    if (expiresAt && expiresAt.getTime() <= now.getTime()) {
      return err(
        new DomainError(
          'ROLE_ASSIGNMENT_EXPIRES_IN_PAST',
          'RoleAssignment expiresAt must be in the future',
        ),
      );
    }

    const assignment = new RoleAssignment(new RoleAssignmentId(), {
      userId,
      roleId,
      roleName,
      tenantId: props.tenantId ?? null,
      assignedBy,
      assignedAt: now,
      expiresAt,
      revokedAt: null,
      revokedBy: null,
      revokedReason: null,
      isExpired: false,
      createdAt: now,
      updatedAt: now,
      version: 0,
    });

    assignment.apply(
      new RoleAssignedEvent(
        assignment.id.value,
        assignment.tenantId,
        assignment.userId,
        assignment.roleId,
        assignment.roleName,
        assignment.assignedBy,
        assignment.expiresAt,
      ),
    );

    return ok(assignment);
  }

  static reconstruct(props: RoleAssignmentReconstructProps): RoleAssignment {
    return new RoleAssignment(props.id, {
      userId: props.userId,
      roleId: props.roleId,
      roleName: props.roleName,
      tenantId: props.tenantId,
      assignedBy: props.assignedBy,
      assignedAt: props.assignedAt,
      expiresAt: props.expiresAt,
      revokedAt: props.revokedAt,
      revokedBy: props.revokedBy,
      revokedReason: props.revokedReason,
      isExpired: props.isExpired,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      version: props.version ?? 0,
    });
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  /**
   * Explicitly revoke this assignment.
   *
   * A revoked assignment is soft-deleted: `isActive()` returns false and the
   * row stays for auditing. Re-revoking returns an error so callers cannot
   * silently overwrite the original revocation metadata.
   */
  revoke(revokedBy: string, reason?: string): Result<void, DomainError> {
    if (this._revokedAt) {
      return err(
        new DomainError(
          'ROLE_ASSIGNMENT_ALREADY_REVOKED',
          'RoleAssignment has already been revoked',
        ),
      );
    }

    const actor = (revokedBy ?? '').trim();
    if (actor.length === 0) {
      return err(
        new DomainError(
          'ROLE_ASSIGNMENT_REVOKED_BY_EMPTY',
          'RoleAssignment revoke requires a revokedBy actor',
        ),
      );
    }

    const normalizedReason = (reason ?? '').trim();
    if (normalizedReason.length > REASON_MAX) {
      return err(
        new DomainError(
          'ROLE_ASSIGNMENT_REASON_TOO_LONG',
          `RoleAssignment reason must be ${REASON_MAX} characters or fewer`,
        ),
      );
    }

    this._revokedAt = new Date();
    this._revokedBy = actor;
    this._revokedReason = normalizedReason.length > 0 ? normalizedReason : null;
    this._updatedAt = new Date();

    this.apply(
      new RoleRevokedEvent(
        this.id.value,
        this._tenantId,
        this._userId,
        this._roleId,
        this._roleName,
        actor,
        this._revokedReason,
      ),
    );

    return ok(undefined);
  }

  /**
   * Lazily mark this assignment as expired.
   *
   * Called by the application layer when a read path detects that `expiresAt`
   * has passed. Idempotent in the sense that it returns an error if the
   * assignment was already marked expired, revoked, or had no expiry.
   */
  markExpired(): Result<void, DomainError> {
    if (this._revokedAt) {
      return err(
        new DomainError(
          'ROLE_ASSIGNMENT_REVOKED',
          'Cannot expire a revoked assignment',
        ),
      );
    }
    if (this._isExpired) {
      return err(
        new DomainError(
          'ROLE_ASSIGNMENT_ALREADY_EXPIRED',
          'RoleAssignment has already expired',
        ),
      );
    }
    if (!this._expiresAt) {
      return err(
        new DomainError(
          'ROLE_ASSIGNMENT_NEVER_EXPIRES',
          'RoleAssignment has no expiresAt',
        ),
      );
    }
    if (this._expiresAt.getTime() > Date.now()) {
      return err(
        new DomainError(
          'ROLE_ASSIGNMENT_NOT_YET_EXPIRED',
          'RoleAssignment has not reached its expiresAt yet',
        ),
      );
    }

    this._isExpired = true;
    this._updatedAt = new Date();

    this.apply(
      new RoleAssignmentExpiredEvent(
        this.id.value,
        this._tenantId,
        this._userId,
        this._roleId,
        this._roleName,
      ),
    );

    return ok(undefined);
  }

  // ─── Queries ──────────────────────────────────────────────────────────────

  /**
   * Pure predicate вЂ” does not mutate state. True when `expiresAt` is in the
   * past relative to the given clock (default: now).
   */
  isExpiredAt(now: Date = new Date()): boolean {
    if (!this._expiresAt) return false;
    return this._expiresAt.getTime() <= now.getTime();
  }

  /**
   * Active = not revoked and not expired (either persisted or detected now).
   */
  isActive(now: Date = new Date()): boolean {
    if (this._revokedAt) return false;
    if (this._isExpired) return false;
    return !this.isExpiredAt(now);
  }
}