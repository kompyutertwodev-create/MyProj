import { DomainError, Entity, Result, err, ok } from '@workspace/kernel';
import { MemberId } from './MemberId.js';
import { MemberRole } from './MemberRole.js';
import { MemberStatus } from './MemberStatus.js';

export interface MemberCreateProps {
  userId: string;
  role: MemberRole;
  status?: MemberStatus;
  invitedBy?: string | null;
}

export interface MemberReconstructProps {
  id: string;
  userId: string;
  role: MemberRole;
  status: MemberStatus;
  invitedBy: string | null;
  joinedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  version?: number;
}

/**
 * Entity: a User's participation inside a Tenant.
 *
 * A Member is not an aggregate root вЂ” it lives inside the Tenant aggregate.
 * One User can be a Member of many Tenants (join entity pattern).
 */
export class Member extends Entity<MemberId> {
  private _userId: string;
  private _role: MemberRole;
  private _status: MemberStatus;
  private _invitedBy: string | null;
  private _joinedAt: Date | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: MemberId,
    userId: string,
    role: MemberRole,
    status: MemberStatus,
    invitedBy: string | null,
    joinedAt: Date | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id);
    this._userId = userId;
    this._role = role;
    this._status = status;
    this._invitedBy = invitedBy;
    this._joinedAt = joinedAt;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  get userId(): string { return this._userId; }
  get role(): MemberRole { return this._role; }
  get status(): MemberStatus { return this._status; }
  get invitedBy(): string | null { return this._invitedBy; }
  get joinedAt(): Date | null { return this._joinedAt; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  static create(props: MemberCreateProps): Result<Member, DomainError> {
    if (!props.userId || props.userId.trim().length === 0) {
      return err(new DomainError('MEMBER_USER_ID_EMPTY', 'Member userId cannot be empty'));
    }

    const now = new Date();
    const status = props.status ?? MemberStatus.Invited;
    const joinedAt = status === MemberStatus.Active ? now : null;

    return ok(
      new Member(
        new MemberId(),
        props.userId.trim(),
        props.role,
        status,
        props.invitedBy ?? null,
        joinedAt,
        now,
        now,
      ),
    );
  }

  static reconstruct(props: MemberReconstructProps): Member {
    return new Member(
      new MemberId(props.id),
      props.userId,
      props.role,
      props.status,
      props.invitedBy,
      props.joinedAt,
      props.createdAt,
      props.updatedAt,
    );
  }

  changeRole(newRole: MemberRole): Result<void, DomainError> {
    if (this._role === newRole) {
      return err(new DomainError('MEMBER_ROLE_SAME', 'New role is the same as current role'));
    }
    this._role = newRole;
    this._updatedAt = new Date();
    return ok(undefined);
  }

  activate(): Result<void, DomainError> {
    if (this._status === MemberStatus.Active) {
      return err(new DomainError('MEMBER_ALREADY_ACTIVE', 'Member is already active'));
    }
    if (this._status === MemberStatus.Removed) {
      return err(new DomainError('MEMBER_REMOVED', 'Cannot activate a removed member'));
    }
    this._status = MemberStatus.Active;
    this._joinedAt = this._joinedAt ?? new Date();
    this._updatedAt = new Date();
    return ok(undefined);
  }

  suspend(): Result<void, DomainError> {
    if (this._status === MemberStatus.Suspended) {
      return err(new DomainError('MEMBER_ALREADY_SUSPENDED', 'Member is already suspended'));
    }
    if (this._status === MemberStatus.Removed) {
      return err(new DomainError('MEMBER_REMOVED', 'Cannot suspend a removed member'));
    }
    this._status = MemberStatus.Suspended;
    this._updatedAt = new Date();
    return ok(undefined);
  }

  remove(): Result<void, DomainError> {
    if (this._status === MemberStatus.Removed) {
      return err(new DomainError('MEMBER_ALREADY_REMOVED', 'Member is already removed'));
    }
    this._status = MemberStatus.Removed;
    this._updatedAt = new Date();
    return ok(undefined);
  }

  isOwner(): boolean {
    return this._role === MemberRole.Owner;
  }

  isActive(): boolean {
    return this._status === MemberStatus.Active;
  }
}