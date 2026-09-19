/** Input for {@link RemovePermissionFromRoleHandler}. */
export interface RemovePermissionFromRoleCommand {
  roleId: string;
  /** e.g. "tenant:create" */
  permissionName: string;
  /** Actor performing the change (for audit). */
  actorId: string;
}