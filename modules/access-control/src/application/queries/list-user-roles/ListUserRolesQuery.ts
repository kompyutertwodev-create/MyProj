/**
 * Input for {@link ListUserRolesHandler}.
 *
 * Defaults to active assignments only (not revoked, not expired). Pass
 * `includeInactive: true` to also return soft-deleted / expired rows for
 * audit or admin views.
 */
export interface ListUserRolesQuery {
  userId: string;
  /** Include revoked / expired assignments. Default: false. */
  includeInactive?: boolean;
}