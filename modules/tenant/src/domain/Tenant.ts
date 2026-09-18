import { AggregateRoot, DomainError, Result, err, ok } from '@workspace/kernel';
import { TenantId } from './TenantId.js';
import { TenantName } from './TenantName.js';
import { TenantSlug } from './TenantSlug.js';
import { TenantSettings, type TenantSettingsInput } from './TenantSettings.js';
import { TenantStatus } from './TenantStatus.js';
import { Member } from './Member.js';
import { MemberRole } from './MemberRole.js';
import { TenantCreatedEvent } from './events/TenantCreatedEvent.js';
import { TenantUpdatedEvent } from './events/TenantUpdatedEvent.js';
import { TenantSuspendedEvent } from './events/TenantSuspendedEvent.js';
import { MemberAddedEvent } from './events/MemberAddedEvent.js';

export interface TenantCreateProps {
  name: TenantName;
  slug: TenantSlug;
  ownerUserId: string;
  settings?: TenantSettingsInput;
}

export interface TenantReconstructProps {
  id: string;
  name: TenantName;
  slug: TenantSlug;
  status: TenantStatus;
  settings: TenantSettings;
  members: Member[];
  ownerUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Aggregate Root: a Tenant (SaaS customer account).
 *
 * Owns its Members and their lifecycle. All business rules about
 * membership and status transitions live here.
 */
export class Tenant extends AggregateRoot<TenantId> {
  private _name: TenantName;
  private _slug: TenantSlug;
  private _status: TenantStatus;
  private _settings: TenantSettings;
  private _members: Member[];
  private _ownerUserId: string;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: TenantId,
    name: TenantName,
    slug: TenantSlug,
    status: TenantStatus,
    settings: TenantSettings,
    members: Member[],
    ownerUserId: string,
    createdAt: Date,
    updatedAt: Date
  ) {
    super(id);
    this._name = name;
    this._slug = slug;
    this._status = status;
    this._settings = settings;
    this._members = [...members];
    this._ownerUserId = ownerUserId;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // --- Getters -------------------------------------------------------------

  get name(): TenantName {
    return this._name;
  }

  get slug(): TenantSlug {
    return this._slug;
  }

  get status(): TenantStatus {
    return this._status;
  }

  get settings(): TenantSettings {
    return this._settings;
  }

  get members(): ReadonlyArray<Member> {
    return this._members;
  }

  get ownerUserId(): string {
    return this._ownerUserId;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // --- Factory -------------------------------------------------------------

  static create(props: TenantCreateProps): Result<Tenant, DomainError> {
    if (!props.ownerUserId || props.ownerUserId.trim().length === 0) {
      return err(new DomainError('TENANT_OWNER_EMPTY', 'Tenant owner userId cannot be empty'));
    }

    const now = new Date();
    const id = new TenantId();
    const settings = TenantSettings.create(props.settings);

    const tenant = new Tenant(
      id,
      props.name,
      props.slug,
      TenantStatus.Active,
      settings,
      [],
      props.ownerUserId.trim(),
      now,
      now
    );

    // Add the owner as the first member
    const ownerResult = Member.create({
      userId: props.ownerUserId.trim(),
      role: MemberRole.Owner,
    });
    if (ownerResult.isErr()) {
      return err(ownerResult.error);
    }
    const owner = ownerResult.value;
    const activation = owner.activate();
    if (activation.isErr()) {
      return err(activation.error);
    }
    tenant._members.push(owner);

    tenant.apply(
      new TenantCreatedEvent(id.value, id.value, props.name.value, props.slug.value)
    );
    tenant.apply(
      new MemberAddedEvent(id.value, id.value, owner.id.value, owner.userId, owner.role)
    );

    return ok(tenant);
  }

  static reconstruct(props: TenantReconstructProps): Tenant {
    return new Tenant(
      new TenantId(props.id),
      props.name,
      props.slug,
      props.status,
      props.settings,
      props.members,
      props.ownerUserId,
      props.createdAt,
      props.updatedAt
    );
  }

  // --- Business methods ----------------------------------------------------

  rename(newName: TenantName): Result<void, DomainError> {
    if (this._name.equals(newName)) {
      return err(new DomainError('TENANT_NAME_SAME', 'New name is the same as current name'));
    }
    this._name = newName;
    this._updatedAt = new Date();
    this.apply(new TenantUpdatedEvent(this.id.value, this.id.value));
    return ok(undefined);
  }

  updateSettings(newSettings: TenantSettings): Result<void, DomainError> {
    this._settings = newSettings;
    this._updatedAt = new Date();
    this.apply(new TenantUpdatedEvent(this.id.value, this.id.value));
    return ok(undefined);
  }

  suspend(reason: string): Result<void, DomainError> {
    if (this._status === TenantStatus.Suspended) {
      return err(new DomainError('TENANT_ALREADY_SUSPENDED', 'Tenant is already suspended'));
    }
    if (this._status === TenantStatus.Deleted) {
      return err(new DomainError('TENANT_DELETED', 'Cannot suspend a deleted tenant'));
    }
    this._status = TenantStatus.Suspended;
    this._updatedAt = new Date();
    this.apply(new TenantSuspendedEvent(this.id.value, this.id.value, reason));
    return ok(undefined);
  }

  activate(): Result<void, DomainError> {
    if (this._status === TenantStatus.Active) {
      return err(new DomainError('TENANT_ALREADY_ACTIVE', 'Tenant is already active'));
    }
    if (this._status === TenantStatus.Deleted) {
      return err(new DomainError('TENANT_DELETED', 'Cannot activate a deleted tenant'));
    }
    this._status = TenantStatus.Active;
    this._updatedAt = new Date();
    return ok(undefined);
  }

  addMember(member: Member): Result<void, DomainError> {
    if (this._status === TenantStatus.Deleted) {
      return err(new DomainError('TENANT_DELETED', 'Cannot add members to a deleted tenant'));
    }
    if (this.hasMember(member.userId)) {
      return err(
        new DomainError('MEMBER_ALREADY_EXISTS', `User "${member.userId}" is already a member`)
      );
    }
    this._members.push(member);
    this._updatedAt = new Date();
    this.apply(
      new MemberAddedEvent(
        this.id.value,
        this.id.value,
        member.id.value,
        member.userId,
        member.role
      )
    );
    return ok(undefined);
  }

  removeMember(memberId: string): Result<void, DomainError> {
    const idx = this._members.findIndex((m) => m.id.value === memberId);
    if (idx === -1) {
      return err(new DomainError('MEMBER_NOT_FOUND', `Member "${memberId}" not found`));
    }
    const member = this._members[idx]!;
    if (member.isOwner()) {
      return err(
        new DomainError('CANNOT_REMOVE_OWNER', 'The owner cannot be removed from the tenant')
      );
    }
    const removal = member.remove();
    if (removal.isErr()) {
      return err(removal.error);
    }
    this._updatedAt = new Date();
    return ok(undefined);
  }

  findMemberByUserId(userId: string): Member | null {
    return this._members.find((m) => m.userId === userId) ?? null;
  }

  hasMember(userId: string): boolean {
    return this._members.some((m) => m.userId === userId);
  }

  isActive(): boolean {
    return this._status === TenantStatus.Active;
  }
}
