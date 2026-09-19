/**
 * Input for {@link CreateRoleHandler}.
 *
 * `permissionNames` are resolved against the role repository / permission
 * catalog inside the handler; callers do not supply Permission objects.
 */
export interface CreateRoleCommand {
  name: string;
  description?: string;
  /** Optional initial permission names ("tenant:create"). */
  permissionNames?: string[];
  /** Optional explicit id for seeding well-known roles. */
  roleId?: string;
  isSystem?: boolean;
  tenantId?: string | null;
  /** Actor performing the change (for audit). */
  actorId: string;
}