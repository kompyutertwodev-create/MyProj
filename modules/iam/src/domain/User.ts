import { AggregateRoot, DomainError, Result, ok, err } from '@workspace/kernel';
import { UserId } from './UserId.js';
import { Email } from './Email.js';
import { PasswordHash } from './PasswordHash.js';
import { UserStatus } from './UserStatus.js';
import { Session } from './Session.js';
import { SessionId } from './SessionId.js';
import { UserRegisteredEvent } from './events/UserRegisteredEvent.js';
import { UserLoggedInEvent } from './events/UserLoggedInEvent.js';
import { UserLoggedOutEvent } from './events/UserLoggedOutEvent.js';
import { UserSuspendedEvent } from './events/UserSuspendedEvent.js';
import { UserActivatedEvent } from './events/UserActivatedEvent.js';
import { UserDeletedEvent } from './events/UserDeletedEvent.js';
import { EmailChangedEvent } from './events/EmailChangedEvent.js';
import { PasswordChangedEvent } from './events/PasswordChangedEvent.js';

export interface UserCreateProps {
  email: Email;
  passwordHash: PasswordHash;
  passwordSet?: boolean;
  displayName: string;
  avatarUrl?: string | null;
  status?: UserStatus;
  tenantId?: string | null;
}

export interface UserReconstructProps {
  id: string;
  email: Email;
  passwordHash: PasswordHash;
  passwordSet: boolean;
  displayName: string;
  avatarUrl: string | null;
  status: UserStatus;
  tenantId: string | null;
  deletedAt: Date | null;
  sessions: Session[];
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

const DISPLAY_NAME_MAX = 100;

/**
 * User aggregate root.
 *
 * Owns identity data only: email, password hash, display name, status and
 * the sessions that reference this user. RBAC (roles, permissions, ABAC
 * policies) lives in @workspace/access-control and is reached through the
 * AuthorizationPort вЂ” the User aggregate deliberately has no `roles`
 * collection so the two modules stay decoupled.
 *
 * Soft delete (`deletedAt`) preserves the audit trail; the email unique
 * index in the database is partial, so a deleted user's email is freed
 * for re-registration.
 */
export class User extends AggregateRoot<UserId> {
  private _email: Email;
  private _passwordHash: PasswordHash;
  private _passwordSet: boolean;
  private _displayName: string;
  private _avatarUrl: string | null;
  private _status: UserStatus;
  private _tenantId: string | null;
  private _deletedAt: Date | null;
  private readonly _sessions: Session[];
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: UserId,
    props: {
      email: Email;
      passwordHash: PasswordHash;
      passwordSet: boolean;
      displayName: string;
      avatarUrl: string | null;
      status: UserStatus;
      tenantId: string | null;
      deletedAt: Date | null;
      sessions: Session[];
      createdAt: Date;
      updatedAt: Date;
      version: number;
    },
  ) {
    super(id, props.version);
    this._email = props.email;
    this._passwordHash = props.passwordHash;
    this._passwordSet = props.passwordSet;
    this._displayName = props.displayName;
    this._avatarUrl = props.avatarUrl;
    this._status = props.status;
    this._tenantId = props.tenantId;
    this._deletedAt = props.deletedAt;
    this._sessions = [...props.sessions];
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  // ─── Getters ──────────────────────────────────────────────────────────────

  get email(): Email { return this._email; }
  get passwordHash(): PasswordHash { return this._passwordHash; }
  get passwordSet(): boolean { return this._passwordSet; }
  get displayName(): string { return this._displayName; }
  get avatarUrl(): string | null { return this._avatarUrl; }
  get status(): UserStatus { return this._status; }
  get tenantId(): string | null { return this._tenantId; }
  get deletedAt(): Date | null { return this._deletedAt; }
  get sessions(): ReadonlyArray<Session> { return this._sessions; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  get isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  // ─── Factory ──────────────────────────────────────────────────────────────

  static create(props: UserCreateProps): Result<User, DomainError> {
    const displayName = (props.displayName ?? '').trim();
    if (displayName.length === 0) {
      return err(
        new DomainError('USER_DISPLAY_NAME_EMPTY', 'Display name cannot be empty'),
      );
    }
    if (displayName.length > DISPLAY_NAME_MAX) {
      return err(
        new DomainError(
          'USER_DISPLAY_NAME_TOO_LONG',
          `Display name cannot exceed ${DISPLAY_NAME_MAX} characters`,
        ),
      );
    }

    const now = new Date();
    const id = new UserId();
    const user = new User(id, {
      email: props.email,
      passwordHash: props.passwordHash,
      passwordSet: props.passwordSet ?? true,
      displayName,
      avatarUrl: props.avatarUrl ?? null,
      status: props.status ?? UserStatus.Unverified,
      tenantId: props.tenantId ?? null,
      deletedAt: null,
      sessions: [],
      createdAt: now,
      updatedAt: now,
      version: 0,
    });

    user.apply(
      new UserRegisteredEvent(id.value, id.value, props.email.value, displayName),
    );

    return ok(user);
  }

  static reconstruct(props: UserReconstructProps): User {
    return new User(new UserId(props.id), {
      email: props.email,
      passwordHash: props.passwordHash,
      passwordSet: props.passwordSet,
      displayName: props.displayName,
      avatarUrl: props.avatarUrl,
      status: props.status,
      tenantId: props.tenantId,
      deletedAt: props.deletedAt,
      sessions: props.sessions,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      version: props.version,
    });
  }

  // ─── Business methods ─────────────────────────────────────────────────────

  changePassword(newHash: PasswordHash): void {
    this._passwordHash = newHash;
    this._passwordSet = true;
    this._updatedAt = new Date();
    this.apply(new PasswordChangedEvent(this.id.value, this.id.value));
  }

  setInitialPassword(newHash: PasswordHash): Result<void, DomainError> {
    if (this._passwordSet) {
      return err(
        new DomainError(
          'PASSWORD_ALREADY_SET',
          'A local password is already configured',
        ),
      );
    }
    this.changePassword(newHash);
    return ok(undefined);
  }

  changeEmail(newEmail: Email): Result<void, DomainError> {
    if (this._email.equals(newEmail)) {
      return err(
        new DomainError('EMAIL_SAME', 'New email is the same as the current email'),
      );
    }
    const oldEmail = this._email.value;
    this._email = newEmail;
    this._updatedAt = new Date();
    this.apply(
      new EmailChangedEvent(this.id.value, this.id.value, oldEmail, newEmail.value),
    );
    return ok(undefined);
  }

  changeDisplayName(next: string): Result<void, DomainError> {
    const normalized = (next ?? '').trim();
    if (normalized.length === 0) {
      return err(
        new DomainError('USER_DISPLAY_NAME_EMPTY', 'Display name cannot be empty'),
      );
    }
    if (normalized.length > DISPLAY_NAME_MAX) {
      return err(
        new DomainError(
          'USER_DISPLAY_NAME_TOO_LONG',
          `Display name cannot exceed ${DISPLAY_NAME_MAX} characters`,
        ),
      );
    }
    if (normalized === this._displayName) {
      return err(
        new DomainError('USER_DISPLAY_NAME_UNCHANGED', 'Display name is unchanged'),
      );
    }
    this._displayName = normalized;
    this._updatedAt = new Date();
    return ok(undefined);
  }

  suspend(reason: string): Result<void, DomainError> {
    if (this._status === UserStatus.Suspended) {
      return err(
        new DomainError('USER_ALREADY_SUSPENDED', 'User is already suspended'),
      );
    }
    if (this.isDeleted) {
      return err(new DomainError('USER_DELETED', 'Cannot suspend a deleted user'));
    }
    this._status = UserStatus.Suspended;
    this._updatedAt = new Date();
    this.apply(new UserSuspendedEvent(this.id.value, this.id.value, reason));
    return ok(undefined);
  }

  activate(): Result<void, DomainError> {
    if (this._status === UserStatus.Active) {
      return err(new DomainError('USER_ALREADY_ACTIVE', 'User is already active'));
    }
    if (this.isDeleted) {
      return err(new DomainError('USER_DELETED', 'Cannot activate a deleted user'));
    }
    this._status = UserStatus.Active;
    this._updatedAt = new Date();
    this.apply(new UserActivatedEvent(this.id.value, this.id.value));
    return ok(undefined);
  }

  /**
   * Soft-delete the user. Emits UserDeletedEvent so audit and cleanup
   * consumers can react; the row stays in the database.
   */
  softDelete(deletedBy: string): Result<void, DomainError> {
    if (this.isDeleted) {
      return err(new DomainError('USER_ALREADY_DELETED', 'User is already deleted'));
    }
    const actor = (deletedBy ?? '').trim();
    if (actor.length === 0) {
      return err(
        new DomainError('USER_DELETED_BY_EMPTY', 'User deletion requires an actor'),
      );
    }
    this._deletedAt = new Date();
    this._status = UserStatus.Deleted;
    this._updatedAt = new Date();
    this.apply(
      new UserDeletedEvent(this.id.value, this.id.value, this._tenantId, actor),
    );
    return ok(undefined);
  }

  addSession(session: Session): void {
    this._sessions.push(session);
    this._updatedAt = new Date();
    this.apply(
      new UserLoggedInEvent(
        this.id.value,
        this.id.value,
        session.id.value,
        session.ipAddress,
      ),
    );
  }

  removeSession(sessionId: string): Result<void, DomainError> {
    const idx = this._sessions.findIndex((s) => s.id.value === sessionId);
    if (idx === -1) {
      return err(
        new DomainError('SESSION_NOT_FOUND', `Session "${sessionId}" not found`),
      );
    }
    this._sessions.splice(idx, 1);
    this._updatedAt = new Date();
    this.apply(new UserLoggedOutEvent(this.id.value, this.id.value, sessionId));
    return ok(undefined);
  }

  isActive(): boolean {
    return this._status === UserStatus.Active && !this.isDeleted;
  }
}