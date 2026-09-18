import type { Role } from '../../../domain/Role.js';

export interface RoleView {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
}

export class RoleTransformer {
  static toView(role: Role): RoleView {
    return {
      id: role.id.value,
      name: role.name.value,
      description: role.description,
      isSystem: role.isSystem,
      permissions: role.permissions.map((p) => p.name),
    };
  }
}
