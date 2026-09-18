import { Entity } from '@workspace/kernel';
import { RoleId } from './RoleId.js';
import { RoleName } from './RoleName.js';
import { Permission } from './Permission.js';

export interface RoleProps {
  name: RoleName;
  description: string;
  permissions: Permission[];
  isSystem: boolean;
}

export class Role extends Entity<RoleId> {
  private _name: RoleName;
  private _description: string;
  private _permissions: Permission[];
  private _isSystem: boolean;

  private constructor(id: RoleId, props: RoleProps) {
    super(id);
    this._name = props.name;
    this._description = props.description;
    this._permissions = [...props.permissions];
    this._isSystem = props.isSystem;
  }

  get name(): RoleName {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get permissions(): ReadonlyArray<Permission> {
    return this._permissions;
  }

  get isSystem(): boolean {
    return this._isSystem;
  }

  addPermission(permission: Permission): void {
    if (!this.hasPermission(permission.name)) {
      this._permissions.push(permission);
    }
  }

  removePermission(name: string): void {
    this._permissions = this._permissions.filter((p) => p.name !== name);
  }

  hasPermission(name: string): boolean {
    return this._permissions.some((p) => p.name === name);
  }

  static create(id: RoleId, props: RoleProps): Role {
    return new Role(id, props);
  }
}
