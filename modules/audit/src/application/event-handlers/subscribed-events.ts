/**
 * Event names that the audit module subscribes to.
 *
 * The EventBus does not support wildcard subscriptions, so each known
 * domain event must be listed explicitly. When a new module emits events
 * that should be audited, add its event name here.
 */
export const AUDITED_EVENT_NAMES = [
  // IAM
  'iam.UserRegistered',
  'iam.UserLoggedIn',
  'iam.UserLoggedOut',
  'iam.UserSuspended',
  'iam.UserActivated',
  'iam.PasswordChanged',
  'iam.EmailChanged',

  // Tenant
  'tenant.created',
  'tenant.updated',
  'tenant.suspended',
  'tenant.member.added',
] as const;

export type AuditedEventName = (typeof AUDITED_EVENT_NAMES)[number];
