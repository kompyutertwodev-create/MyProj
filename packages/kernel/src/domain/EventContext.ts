import type { EventMetadata } from './EventMetadata.js';

/**
 * Ambient context captured at the entry point of a request.
 *
 * A single `EventContext` is threaded through the application layer and
 * applied to every event raised while handling that request, so handlers
 * do not need to construct metadata by hand. It is a strict subset of
 * {@link EventMetadata} вЂ” only the fields that originate from the caller,
 * not the ones the outbox computes (`recordedAt`, `aggregateVersion`).
 */
export interface EventContext {
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly actorId?: string;
  readonly tenantId?: string | null;
  readonly extras?: Readonly<Record<string, unknown>>;
}

/** Empty context вЂ” useful as a default and in tests. */
export const EMPTY_EVENT_CONTEXT: EventContext = Object.freeze({});

/**
 * Merge a request-scoped context with a per-event override.
 *
 * The override wins field by field, which lets an aggregate that knows its
 * own tenant override whatever the caller supplied (defense against
 * spoofing) while still inheriting `correlationId` and `actorId`.
 */
export function mergeContext(
  base: EventContext,
  override: Partial<EventContext> = {},
): EventContext {
  return {
    correlationId: override.correlationId ?? base.correlationId,
    causationId: override.causationId ?? base.causationId,
    actorId: override.actorId ?? base.actorId,
    tenantId: override.tenantId !== undefined ? override.tenantId : base.tenantId,
    extras: { ...(base.extras ?? {}), ...(override.extras ?? {}) },
  };
}

/**
 * Build an {@link EventMetadata} from an {@link EventContext} plus the
 * per-event fields the infrastructure layer knows.
 */
export function metadataFromContext(
  context: EventContext,
  extra: Pick<EventMetadata, 'recordedAt' | 'aggregateVersion' | 'schemaVersion'> = {},
): EventMetadata {
  return {
    correlationId: context.correlationId,
    causationId: context.causationId,
    actorId: context.actorId,
    tenantId: context.tenantId,
    extras: context.extras,
    ...extra,
  };
}