/**
 * Well-known audit event types.
 *
 * The list is intentionally open: modules can extend it as they grow.
 * Use dot-separated namespaces ("iam.user.registered", "tenant.member.added").
 */
export enum AuditEventType {
  // IAM events
  UserRegistered = 'iam.user.registered',
  UserLoggedIn = 'iam.user.logged_in',
  UserLoggedOut = 'iam.user.logged_out',
  UserSuspended = 'iam.user.suspended',
  UserActivated = 'iam.user.activated',
  PasswordChanged = 'iam.user.password_changed',
  EmailChanged = 'iam.user.email_changed',

  // Tenant events
  TenantCreated = 'tenant.created',
  TenantUpdated = 'tenant.updated',
  TenantSuspended = 'tenant.suspended',
  MemberAdded = 'tenant.member.added',
  MemberRemoved = 'tenant.member.removed',
}
