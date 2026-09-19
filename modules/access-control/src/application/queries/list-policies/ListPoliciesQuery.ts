/**
 * Input for {@link ListPoliciesHandler}.
 *
 * `onlyActive` defaults to true so the common admin UI shows only the
 * policies that actually influence authorization decisions. Pass false to
 * include deactivated and soft-deleted rows.
 */
export interface ListPoliciesQuery {
  /** Default true вЂ” hide inactive/deleted rows. */
  onlyActive?: boolean;
  /** Optional tenant scope filter. */
  tenantId?: string | null;
  /** Optional free-text filter applied to the policy name. */
  search?: string;
}