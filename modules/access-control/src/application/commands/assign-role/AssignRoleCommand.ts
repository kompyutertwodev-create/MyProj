/**
 * Input for {@link AssignRoleHandler}.
 *
 * The handler resolves the role by id (so callers cannot forge a name)
 * and refuses to create a duplicate active assignment for the same
 * (userId, roleId) pair.
 */
export interface AssignRoleCommand {
  /** Subject to grant the role to (typically a user id). */
  userId: string;
  /** Id of the role to grant. */
  roleId: string;
  /** Actor performing the assignment (for audit). */
  assignedBy: string;
  /** Optional tenant scope; null = global / platform-wide assignment. */
  tenantId?: string | null;
  /** Optional time-box; omit for "never expires". */
  expiresAt?: Date | null;
}