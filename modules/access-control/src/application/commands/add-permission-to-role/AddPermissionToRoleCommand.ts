/** Input for {@link AddPermissionToRoleHandler}. */
export interface AddPermissionToRoleCommand {
  roleId: string;
  /** e.g. "tenant:create" */
  permissionName: string;
  /** Optional description recorded alongside the permission. */
  permissionDescription?: string;
  /** Actor performing the change (for audit). */
  actorId: string;
}