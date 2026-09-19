/**
 * Outbound port through which the IAM module reaches the authorization
 * engine.
 *
 * RBAC (roles, permissions) and ABAC (policies) live in
 * @workspace/access-control. IAM needs two things from them:
 *
 *   - the role names a user currently holds, so access tokens can carry
 *     role claims;
 *   - a permission check, so login flows and middleware can make
 *     authorization decisions without importing the other module.
 *
 * Concrete implementations live in the composition root (apps/api) and
 * delegate to the access-control handlers.
 */
export interface AuthorizationPort {
  /**
   * Return the names of every role the user currently holds.
   *
   * The list is deduplicated and excludes revoked / expired assignments.
   * Callers should treat an empty array as "no roles".
   */
  getRoleNames(userId: string): Promise<string[]>;

  /**
   * Check whether the user may perform `action` on `resource`.
   *
   * Combines RBAC (role permissions) and ABAC (policy evaluation). The
   * `reason` field is informational вЂ” useful for audit and for debugging
   * unexpected decisions вЂ” and is not part of the security contract.
   */
  checkPermission(input: {
    userId: string;
    resource: string;
    action: string;
    resourceAttributes?: Record<string, unknown>;
    environmentAttributes?: Record<string, unknown>;
  }): Promise<{ allowed: boolean; reason: string }>;
}