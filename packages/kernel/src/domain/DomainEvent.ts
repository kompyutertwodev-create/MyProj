/**
 * Marker interface for all domain events.
 * Every concrete event must supply a stable `eventName` (used for routing)
 * and the `occurredAt` timestamp.
 */
export interface DomainEvent {
  /** Globally unique event id — use crypto.randomUUID() or cuid2. */
  readonly eventId: string;
  /** Fully-qualified event type, e.g. "iam.UserRegistered". */
  readonly eventName: string;
  /** Wall-clock time the event was raised (ISO-8601). */
  readonly occurredAt: Date;
  /** Aggregate id that raised this event. */
  readonly aggregateId: string;
  /** Aggregate type, e.g. "User". */
  readonly aggregateType: string;
}
