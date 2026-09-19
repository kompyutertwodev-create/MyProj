import { AggregateRoot, DomainError, Result, ok, err } from '@workspace/kernel';
import { RoleId } from './RoleId.js';
import { RoleName } from './RoleName.js';
import type { Permission } from '../permission/Permission.js';
import {
  RoleCreatedEvent,
  RoleUpdatedEvent,
  RoleDeletedEvent,
  RolePermissionAddedEvent,
  RolePermissionRemovedEvent,
} from './events/index.js';

export interface RoleCreateProps {
  name: RoleName;
  description: string;
  permissions?: Permission[];
  isSystem?: boolean;
  tenantId?: string | null;
}

export interface RoleReconstructProps {
  id: RoleId;
  name: RoleName;
  description: string;
  permissions: Permission[];
  isSystem: boolean;
  tenantId: string | null;
  createdAt: Date;
  updatedAt: Date;
  version?: number;
}

export class Role extends AggregateRoot<RoleId> {
  private _name: RoleName;
  private _description: string;
  private _permissions: Permission[];
  private readonly _isSystem: boolean;
  private readonly _tenantId: string | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: RoleId,
    props: {
      name: RoleName;
      description: string;
      permissions: Permission[];
      isSystem: boolean;
      tenantId: string | null;
      createdAt: Date;
      updatedAt: Date;
      version: number;
    },
  ) {
    super(id, props.version);
    this._name = props.name;
    this._description = props.description;
    this._permissions = [...props.permissions];
    this._isSystem = props.isSystem;
    this._tenantId = props.tenantId;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  get name(): RoleName { return this._name; }
  get description(): string { return this._description; }
  get permissions(): ReadonlyArray<Permission> { return this._permissions; }
  get isSystem(): boolean { return this._isSystem; }
  get tenantId(): string | null { return this._tenantId; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  static create(props: RoleCreateProps, id?: RoleId): Result<Role, DomainError> {
    const description = (props.description ?? '').trim();
    if (description.length > 500) {
      return err(new DomainError('ROLE_DESCRIPTION_TOO_LONG', 'Role description must be 500 characters or fewer'));
    }

    const now = new Date();
    const role = new Role(id ?? new RoleId(), {
      name: props.name,
      description,
      permissions: props.permissions ?? [],
      isSystem: props.isSystem ?? false,
      tenantId: props.tenantId ?? null,
      createdAt: now,
      updatedAt: now,
      version: 0,
    });

    role.apply(new RoleCreatedEvent(role.id.value, role.tenantId, role.name.value, role.isSystem));
    return ok(role);
  }

  static reconstruct(props: RoleReconstructProps): Role {
    return new Role(props.id, {
      name: props.name,
      description: props.description,
      permissions: props.permissions,
      isSystem: props.isSystem,
      tenantId: props.tenantId,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      version: props.version ?? 0,
    });
  }

  rename(next: RoleName): Result<void, DomainError> {
    if (this._isSystem) {
      return err(new DomainError('ROLE_SYSTEM_IMMUTABLE', 'System roles cannot be renamed'));
    }
    if (this._name.equals(next)) {
      return err(new DomainError('ROLE_NAME_UNCHANGED', 'Role name is unchanged'));
    }
    this._name = next;
    this._updatedAt = new Date();
    this.apply(new RoleUpdatedEvent(this.id.value, this._tenantId, this._name.value));
    return ok(undefined);
  }

  updateDescription(next: string): Result<void, DomainError> {
    const normalized = (next ?? '').trim();
    if (normalized.length > 500) {
      return err(new DomainError('ROLE_DESCRIPTION_TOO_LONG', 'Role description must be 500 characters or fewer'));
    }
    if (normalized === this._description) {
      return err(new DomainError('ROLE_DESCRIPTION_UNCHANGED', 'Role description is unchanged'));
    }
    this._description = normalized;
    this._updatedAt = new Date();
    this.apply(new RoleUpdatedEvent(this.id.value, this._tenantId, this._name.value));
    return ok(undefined);
  }

  addPermission(permission: Permission): Result<void, DomainError> {
    if (this._isSystem) {
      return err(new DomainError('ROLE_SYSTEM_IMMUTABLE', 'System roles cannot have permissions modified'));
    }
    if (this.hasPermission(permission.name)) {
      return err(new DomainError('ROLE_PERMISSION_DUPLICATE', `Permission "${permission.name}" is already granted`));
    }
    this._permissions.push(permission);
    this._updatedAt = new Date();
    this.apply(new RolePermissionAddedEvent(this.id.value, this._tenantId, permission.name));
    return ok(undefined);
  }

  removePermission(permissionName: string): Result<void, DomainError> {
    if (this._isSystem) {
      return err(new DomainError('ROLE_SYSTEM_IMMUTABLE', 'System roles cannot have permissions modified'));
    }
    const idx = this._permissions.findIndex((p) => p.name === permissionName);
    if (idx === -1) {
      return err(new DomainError('ROLE_PERMISSION_NOT_FOUND', `Permission "${permissionName}" is not granted to this role`));
    }
    this._permissions.splice(idx, 1);
    this._updatedAt = new Date();
    this.apply(new RolePermissionRemovedEvent(this.id.value, this._tenantId, permissionName));
    return ok(undefined);
  }

  replacePermissions(next: ReadonlyArray<Permission>): Result<void, DomainError> {
    if (this._isSystem) {
      return err(new DomainError('ROLE_SYSTEM_IMMUTABLE', 'System roles cannot have permissions modified'));
    }
    const nextByName = new Map(next.map((p) => [p.name, p]));
    for (const current of [...this._permissions]) {
      if (!nextByName.has(current.name)) {
        const result = this.removePermission(current.name);
        if (result.isErr()) return result;
      }
    }
    for (const permission of nextByName.values()) {
      if (!this.hasPermission(permission.name)) {
        const result = this.addPermission(permission);
        if (result.isErr()) return result;
      }
    }
    return ok(undefined);
  }

  /**
   * Mark this role as deleted and emit a {@link RoleDeletedEvent}. The
   * aggregate is expected to be removed by the repository immediately
   * afterwards (hard delete); the event exists so downstream consumers
   * can react before the row disappears.
   */
  delete(deletedBy: string): Result<void, DomainError> {
    if (this._isSystem) {
      return err(new DomainError('ROLE_SYSTEM_IMMUTABLE', 'System roles cannot be deleted'));
    }
    const actor = (deletedBy ?? '').trim();
    if (actor.length === 0) {
      return err(new DomainError('ROLE_DELETED_BY_EMPTY', 'Role deletion requires a deletedBy actor'));
    }
    this.apply(new RoleDeletedEvent(this.id.value, this._tenantId, this._name.value, actor));
    return ok(undefined);
  }

  hasPermission(permissionName: string): boolean {
    return this._permissions.some((p) => p.name === permissionName);
  }

  permissionNames(): string[] {
    return this._permissions.map((p) => p.name);
  }
}