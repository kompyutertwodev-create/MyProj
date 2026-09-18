/**
 * Role of a Member inside a Tenant.
 *
 * Hierarchy (highest to lowest):
 * - Owner   - full control, can delete tenant, manage billing
 * - Admin   - manage members, settings, all business data
 * - Manager - manage day-to-day operations, limited admin rights
 * - Member  - regular user, read/write access to business data
 */
export enum MemberRole {
  Owner = 'owner',
  Admin = 'admin',
  Manager = 'manager',
  Member = 'member',
}
