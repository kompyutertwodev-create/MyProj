/**
 * Input for {@link RevokeRoleHandler}.
 *
 * Revocation is soft: the assignment row stays in the database with
 * `revokedAt` set, preserving the audit trail.
 */
export interface RevokeRoleCommand {
  /** Id of the assignment to revoke. */
  assignmentId: string;
  /** Actor performing the revocation (for audit). */
  revokedBy: string;
  /** Optional human-readable reason (max 500 chars). */
  reason?: string;
}