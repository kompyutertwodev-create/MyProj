/**
 * Input for {@link UpdateRoleHandler}.
 *
 * Only the fields present in the command are applied вЂ” `undefined` means
 * "leave unchanged". This lets the HTTP layer pass a partial body without
 * having to diff against the current state.
 */
export interface UpdateRoleCommand {
  roleId: string;
  /** New role name; omit to keep the current one. */
  name?: string;
  /** New description; omit to keep the current one. */
  description?: string;
  /** Actor performing the change (for audit). */
  actorId: string;
}