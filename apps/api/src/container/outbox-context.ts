import {
  mergeContext,
  type EventContext,
  type EventEnvelope,
} from '@workspace/kernel';
import type { DomainEvent } from '@workspace/kernel';
import { getEventContext } from '../context/index.js';

/**
 * Structural shape of an OutboxPort that supports an optional EventContext.
 *
 * We deliberately do not import OutboxPort from a specific module: iam and
 * access-control each own their own interface, and we want a single
 * wrapper to work for both as long as they share this shape.
 */
export interface ContextAwareOutbox {
  enqueue(event: DomainEvent, context?: EventContext): Promise<void>;
  enqueueAll(
    events: ReadonlyArray<DomainEvent>,
    context?: EventContext,
  ): Promise<void>;
  enqueueEnvelopes(envelopes: ReadonlyArray<EventEnvelope>): Promise<void>;
}

/**
 * Wrap an OutboxPort so that every event automatically inherits the
 * ambient EventContext (correlationId, actorId, tenantId) installed by the
 * request-context middleware.
 *
 * The caller-supplied context still wins field-by-field, so a handler can
 * override actorId or tenantId when it needs to.
 *
 * Outside of a request (background jobs, tests) getEventContext() returns
 * EMPTY_EVENT_CONTEXT, so this wrapper is a no-op there.
 */
export function withAmbientContext<T extends ContextAwareOutbox>(outbox: T): T {
  const wrap = (ctx?: EventContext): EventContext =>
    mergeContext(getEventContext(), ctx ?? {});

  return {
    enqueue: (event, ctx) => outbox.enqueue(event, wrap(ctx)),
    enqueueAll: (events, ctx) => outbox.enqueueAll(events, wrap(ctx)),
    enqueueEnvelopes: (envelopes) => outbox.enqueueEnvelopes(envelopes),
  } as T;
}