/**
 * Lifecycle status of a Member inside a Tenant.
 *
 * - Invited   - invitation sent, awaiting acceptance
 * - Active    - full member, can access tenant resources
 * - Suspended - temporarily blocked by admin
 * - Removed   - soft-deleted, kept for audit purposes
 */
export enum MemberStatus {
  Invited = 'invited',
  Active = 'active',
  Suspended = 'suspended',
  Removed = 'removed',
}
