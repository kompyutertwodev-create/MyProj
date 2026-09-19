/** Input for {@link DeleteRoleHandler}. */
export interface DeleteRoleCommand {
  roleId: string;
  /** Actor performing the change (for audit). */
  actorId: string;
}