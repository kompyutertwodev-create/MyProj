/**
 * Cross-cutting metadata attached to a domain event at the boundary of the
 * application layer.
 *
 * These fields are deliberately *not* part of {@link DomainEvent}: the
 * domain only cares about facts, not about who requested them, which
 * request they belong to, or how they will be persisted. The application
 * and infrastructure layers enrich events with this metadata right before
 * handing them to the outbox or an event bus.
 *
 * All fields are optional вЂ” a freshly raised domain event starts with no
 * metadata at all, and tests can ignore the concept entirely.
 */
export interface EventMetadata {
  /**
   * Groups every event produced while handling a single inbound request
   * (HTTP, gRPC, message). Use the request id when available.
   */
  readonly correlationId?: string;

  /**
   * The id of the event or command that directly caused this one. Combined
   * with `correlationId`, this reconstructs the causal chain.
   */
  readonly causationId?: string;

  /**
   * The user (or service account) on whose behalf the event was raised.
   * Used by audit and notification consumers.
   */
  readonly actorId?: string;

  /**
   * Tenant scope, if the aggregate belongs to one. Null means "platform
   * scope"; undefined means "not applicable / not set".
   */
  readonly tenantId?: string | null;

  /**
   * Wall-clock time at which the event was persisted to the outbox. Differs
   * from `occurredAt` when the outbox is drained asynchronously.
   */
  readonly recordedAt?: Date;

  /**
   * Aggregate version at the moment the event was raised. Populated by the
   * aggregate root; used for optimistic concurrency and event replay.
   */
  readonly aggregateVersion?: number;

  /**
   * Schema version of the event payload. Bump when a breaking change is
   * made so old consumers can fall back to a previous decoder.
   */
  readonly schemaVersion?: number;

  /**
   * Free-form bag for adapters that need to carry extra context (tracing
   * headers, feature flags, ...) without expanding this interface.
   */
  readonly extras?: Readonly<Record<string, unknown>>;
}