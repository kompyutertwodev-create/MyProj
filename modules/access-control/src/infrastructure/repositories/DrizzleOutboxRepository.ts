import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type {
  DomainEvent,
  EventContext,
  EventEnvelope,
} from '@workspace/kernel';
import {
  EMPTY_EVENT_CONTEXT,
  envelopeOf,
  metadataFromContext,
} from '@workspace/kernel';
import type { OutboxPort } from '../../application/ports/OutboxPort.js';
import { acOutboxEvents } from '../database/schema/outbox-events.table.js';

/**
 * Drizzle-backed OutboxPort.
 *
 * Only the write side lives here: rows are appended inside the handler's
 * transaction, then a dispatcher owned by the platform drains them. That
 * keeps `access-control` free of message-broker concerns while still
 * providing at-least-once delivery guarantees.
 *
 * Metadata columns are denormalized so the dispatcher can index by
 * correlation id or filter by actor/tenant without decoding the JSONB
 * payload.
 *
 * The `db` type is intentionally `any` вЂ” same reasoning as the other
 * repositories: the generated Drizzle generic cannot express a transaction
 * client that is interchangeable with the main connection.
 */
export class DrizzleOutboxRepository implements OutboxPort {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly db: NodePgDatabase<any>) {}

  async enqueue(
    event: DomainEvent,
    context: EventContext = EMPTY_EVENT_CONTEXT,
  ): Promise<void> {
    const envelope = envelopeOf(event, metadataFromContext(context));
    await this.db
      .insert(acOutboxEvents)
      .values(this.toRow(envelope))
      .onConflictDoNothing();
  }

  async enqueueAll(
    events: ReadonlyArray<DomainEvent>,
    context: EventContext = EMPTY_EVENT_CONTEXT,
  ): Promise<void> {
    if (events.length === 0) return;
    const envelopes = events.map((event) =>
      envelopeOf(event, metadataFromContext(context)),
    );
    await this.enqueueEnvelopes(envelopes);
  }

  async enqueueEnvelopes(
    envelopes: ReadonlyArray<EventEnvelope>,
  ): Promise<void> {
    if (envelopes.length === 0) return;
    await this.db
      .insert(acOutboxEvents)
      .values(envelopes.map((e) => this.toRow(e)))
      .onConflictDoNothing();
  }

  /**
   * Denormalize an envelope into the row shape expected by Drizzle.
   * Kept private so future columns only need to be added here.
   */
  private toRow(envelope: EventEnvelope) {
    const { event, metadata } = envelope;
    const recordedAt = metadata.recordedAt ?? new Date();
    return {
      id: event.eventId,
      eventName: event.eventName,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      tenantId: metadata.tenantId ?? null,
      payload: event as unknown as Record<string, unknown>,
      occurredAt: event.occurredAt,
      createdAt: recordedAt,
      correlationId: metadata.correlationId ?? null,
      causationId: metadata.causationId ?? null,
      actorId: metadata.actorId ?? null,
      schemaVersion: metadata.schemaVersion ?? 1,
      metadata: metadata.extras ?? {},
      aggregateVersion: metadata.aggregateVersion ?? 0,
    };
  }
}