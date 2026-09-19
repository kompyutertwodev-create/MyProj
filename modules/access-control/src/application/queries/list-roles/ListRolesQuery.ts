/**
 * Input for {@link ListRolesHandler}.
 *
 * Pagination is opt-in: when `page` is omitted the handler returns the
 * whole collection (useful for admin UIs that render every role).
 * `tenantId` filters the collection; pass `null` to include global
 * (platform) roles only.
 */
export interface ListRolesQuery {
  /** 1-based page number. Omit for "no pagination". */
  page?: number;
  /** Items per page (default 20, max 200). Ignored when page is omitted. */
  pageSize?: number;
  /** Filter by tenant; null = system / global roles only. */
  tenantId?: string | null;
  /** Free-text filter applied to the role name (case-insensitive). */
  search?: string;
}