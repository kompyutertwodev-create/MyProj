/**
 * Input for {@link ListRoleAssignmentsHandler}.
 *
 * Answers the reverse question of `list-user-roles`: "who currently holds
 * this role?" Useful for admin UIs and for auditing tenant membership.
 */
export interface ListRoleAssignmentsQuery {
  roleId: string;
  /** Include revoked / expired assignments. Default: false. */
  includeInactive?: boolean;
}