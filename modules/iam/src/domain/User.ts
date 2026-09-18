import { AggregateRoot, DomainError, Result, ok, err } from '@workspace/kernel';
import { UserId } from './UserId.js';
import { Email } from './Email.js';
import { PasswordHash } from './PasswordHash.js';
import { UserStatus } from './UserStatus.js';
import { Role } from './Role.js';
import { Session } from './Session.js';
import { SessionId } from './SessionId.js';
import { UserRegisteredEvent } from './events/UserRegisteredEvent.js';
import { UserLoggedInEvent } from './events/UserLoggedInEvent.js';
import { UserLoggedOutEvent } from './events/UserLoggedOutEvent.js';
import { UserSuspendedEvent } from './events/UserSuspendedEvent.js';
import { UserActivatedEvent } from './events/UserActivatedEvent.js';
import { EmailChangedEvent } from './events/EmailChangedEvent.js';
import { PasswordChangedEvent } from './events/PasswordChangedEvent.js';

export interface UserCreateProps {
  email: Email;
  passwordHash: PasswordHash;
  passwordSet?: boolean;
  displayName: string;
  avatarUrl?: string | null;
  status?: UserStatus;
  roles?: Role[];
}

export interface UserReconstructProps {
  id: string;
  email: Email;
  passwordHash: PasswordHash;
  passwordSet: boolean;
  displayName: string;
  avatarUrl: string | null;
  status: UserStatus;
  roles: Role[];
  sessions: Session[];
  createdAt: Date;
  updatedAt: Date;
}

export class User extends AggregateRoot<UserId> {
  private _email: Email;
  private _passwordHash: PasswordHash;
  private _passwordSet: boolean;
  private _displayName: string;
  private _avatarUrl: string | null;
  private _status: UserStatus;
  private _roles: Role[];
  private _sessions: Session[];
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: UserId,
    email: Email,
    passwordHash: PasswordHash,
    passwordSet: boolean,
    displayName: string,
    avatarUrl: string | null,
    status: UserStatus,
    roles: Role[],
    sessions: Session[],
    createdAt: Date,
    updatedAt: Date
  ) {
    super(id);
    this._email = email;
    this._passwordHash = passwordHash;
    this._passwordSet = passwordSet;
    this._displayName = displayName;
    this._avatarUrl = avatarUrl;
    this._status = status;
    this._roles = [...roles];
    this._sessions = [...sessions];
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // ─── Getters ────────────────────────────────────────────────────────────
  get email(): Email {
    return this._email;
  }
  get passwordHash(): PasswordHash {
    return this._passwordHash;
  }
  get passwordSet(): boolean {
    return this._passwordSet;
  }
  get displayName(): string {
    return this._displayName;
  }
  get avatarUrl(): string | null {
    return this._avatarUrl;
  }
  get status(): UserStatus {
    return this._status;
  }
  get roles(): ReadonlyArray<Role> {
    return this._roles;
  }
  get sessions(): ReadonlyArray<Session> {
    return this._sessions;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ─── Factory ─────────────────────────────────────────────────────────────
  static create(props: UserCreateProps): Result<User, DomainError> {
    if (!props.displayName || props.displayName.trim().length === 0) {
      return err(new DomainError('USER_DISPLAY_NAME_EMPTY', 'Display name cannot be empty'));
    }
    if (props.displayName.trim().length > 100) {
      return err(
        new DomainError('USER_DISPLAY_NAME_TOO_LONG', 'Display name cannot exceed 100 characters')
      );
    }

    const now = new Date();
    const id = new UserId();
    const user = new User(
      id,
      props.email,
      props.passwordHash,
      props.passwordSet ?? true,
      props.displayName.trim(),
      props.avatarUrl ?? null,
      props.status ?? UserStatus.Unverified,
      props.roles ?? [],
      [],
      now,
      now
    );

    user.apply(
      new UserRegisteredEvent(id.value, id.value, props.email.value, props.displayName.trim())
    );

    return ok(user);
  }

  static reconstruct(props: UserReconstructProps): User {
    return new User(
      new UserId(props.id),
      props.email,
      props.passwordHash,
      props.passwordSet,
      props.displayName,
      props.avatarUrl,
      props.status,
      props.roles,
      props.sessions,
      props.createdAt,
      props.updatedAt
    );
  }

  // ─── Business Methods ────────────────────────────────────────────────────
  changePassword(newHash: PasswordHash): void {
    this._passwordHash = newHash;
    this._passwordSet = true;
    this._updatedAt = new Date();
    this.apply(new PasswordChangedEvent(this.id.value, this.id.value));
  }

  setInitialPassword(newHash: PasswordHash): Result<void, DomainError> {
    if (this._passwordSet) {
      return err(new DomainError('PASSWORD_ALREADY_SET', 'A local password is already configured'));
    }
    this.changePassword(newHash);
    return ok(undefined);
  }

  changeEmail(newEmail: Email): Result<void, DomainError> {
    if (this._email.equals(newEmail)) {
      return err(new DomainError('EMAIL_SAME', 'New email is the same as the current email'));
    }
    const oldEmail = this._email.value;
    this._email = newEmail;
    this._updatedAt = new Date();
    this.apply(new EmailChangedEvent(this.id.value, this.id.value, oldEmail, newEmail.value));
    return ok(undefined);
  }

  assignRole(role: Role): Result<void, DomainError> {
    const already = this._roles.some((r) => r.name.value === role.name.value);
    if (already) {
      return err(
        new DomainError('ROLE_ALREADY_ASSIGNED', `Role "${role.name.value}" is already assigned`)
      );
    }
    this._roles.push(role);
    this._updatedAt = new Date();
    return ok(undefined);
  }

  removeRole(roleName: string): Result<void, DomainError> {
    const idx = this._roles.findIndex((r) => r.name.value === roleName);
    if (idx === -1) {
      return err(new DomainError('ROLE_NOT_FOUND', `Role "${roleName}" is not assigned to user`));
    }
    this._roles.splice(idx, 1);
    this._updatedAt = new Date();
    return ok(undefined);
  }

  suspend(reason: string): Result<void, DomainError> {
    if (this._status === UserStatus.Suspended) {
      return err(new DomainError('USER_ALREADY_SUSPENDED', 'User is already suspended'));
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
    if (this._status === UserStatus.Deleted) {
      return err(new DomainError('USER_DELETED', 'Cannot activate a deleted user'));
    }
    this._status = UserStatus.Active;
    this._updatedAt = new Date();
    this.apply(new UserActivatedEvent(this.id.value, this.id.value));
    return ok(undefined);
  }

  addSession(session: Session): void {
    this._sessions.push(session);
    this._updatedAt = new Date();
    this.apply(
      new UserLoggedInEvent(this.id.value, this.id.value, session.id.value, session.ipAddress)
    );
  }

  removeSession(sessionId: string): Result<void, DomainError> {
    const idx = this._sessions.findIndex((s) => s.id.value === sessionId);
    if (idx === -1) {
      return err(new DomainError('SESSION_NOT_FOUND', `Session "${sessionId}" not found`));
    }
    this._sessions.splice(idx, 1);
    this._updatedAt = new Date();
    this.apply(new UserLoggedOutEvent(this.id.value, this.id.value, sessionId));
    return ok(undefined);
  }

  hasRole(roleName: string): boolean {
    return this._roles.some((r) => r.name.value === roleName);
  }

  hasPermission(permissionName: string): boolean {
    return this._roles.some((r) => r.hasPermission(permissionName));
  }

  isActive(): boolean {
    return this._status === UserStatus.Active;
  }
}
