/**
 * Lifecycle status of a Tenant (SaaS customer account).
 *
 * - Active    - tenant is operational, all features available
 * - Suspended - tenant temporarily disabled (billing issue, policy violation)
 * - Deleted   - soft-deleted, pending permanent removal
 */
export enum TenantStatus {
  Active = 'active',
  Suspended = 'suspended',
  Deleted = 'deleted',
}
