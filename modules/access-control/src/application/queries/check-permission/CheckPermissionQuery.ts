/**
 * Input for {@link CheckPermissionHandler}.
 *
 * The caller must pass the resource and action explicitly вЂ” we do not
 * accept a combined "resource:action" string because splitting it would
 * re-introduce the parsing ambiguity we just removed.
 */
export interface CheckPermissionQuery {
  userId: string;
  /** Resource identifier, e.g. "tenant" or "catalog:movie". */
  resource: string;
  /** Action identifier, e.g. "create" or "read". */
  action: string;
  /** Optional resource attributes for ABAC conditions. */
  resourceAttributes?: Record<string, unknown>;
  /** Optional environment attributes for ABAC conditions. */
  environmentAttributes?: Record<string, unknown>;
}