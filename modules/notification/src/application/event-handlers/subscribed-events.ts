/**
 * Event names that the notification module subscribes to.
 */
export const NOTIFIED_EVENT_NAMES = [
  'iam.UserRegistered',
  'tenant.created',
  'tenant.member.added',
] as const;

export type NotifiedEventName = (typeof NOTIFIED_EVENT_NAMES)[number];
