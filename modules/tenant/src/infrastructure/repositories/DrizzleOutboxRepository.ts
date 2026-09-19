import { and, eq, lte, or, sql } from 'drizzle-orm';
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
import type { OutboxMessage, OutboxStore } from '@workspace/platform';
import type { OutboxPort } from '../../application/ports/OutboxPort.js';
import { outboxEvents } from '../database/schema/outbox-events.table.js';

interface ClaimedRow {
  id: string;
  eventName: string;
  aggregateId: string;
  aggregateType: string;
  payload: unknown;
  attempts: number;
  occurredAt: Date;
}

/**
 * Drizzle-backed outbox repository.
 *
 * Implements both:
 *   - `OutboxPort`  вЂ” the module's write-side contract (handlers depend on this)
 *   - `OutboxStore` вЂ” the platform's dispatcher contract (claimBatch / mark*)
 *
 * The `context` parameter is optional: handlers that thread metadata
 * through use it; the ambient `withAmbientContext` proxy injects it
 * automatically when omitted.
 */
export class DrizzleOutboxRepository implements OutboxPort, OutboxStore {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly db: NodePgDatabase<any>) {}

  async enqueue(
    event: DomainEvent,
    context: EventContext = EMPTY_EVENT_CONTEXT,
  ): Promise<void> {
    const envelope = envelopeOf(event, metadataFromContext(context));
    await this.enqueueEnvelopes([envelope]);
  }

  async enqueueAll(
    events: ReadonlyArray<DomainEvent>,
    context: EventContext = EMPTY_EVENT_CONTEXT,
  ): Promise<void> {
    const envelopes = events.map((event) =>
      envelopeOf(event, metadataFromContext(context)),
    );
    await this.enqueueEnvelopes(envelopes);
  }

  async enqueueEnvelopes(
    envelopes: ReadonlyArray<EventEnvelope>,
  ): Promise<void> {
    if (envelopes.length === 0) return;
    for (const envelope of envelopes) {
      const { event, metadata } = envelope;
      await this.db
        .insert(outboxEvents)
        .values({
          id: event.eventId,
          eventName: event.eventName,
          aggregateId: event.aggregateId,
          aggregateType: event.aggregateType,
          payload: event as unknown as Record<string, unknown>,
          occurredAt: event.occurredAt,
          createdAt: new Date(),
          availableAt: new Date(),
          tenantId: metadata.tenantId ?? null,
          correlationId: metadata.correlationId ?? null,
          causationId: metadata.causationId ?? null,
          actorId: metadata.actorId ?? null,
          schemaVersion: metadata.schemaVersion ?? 1,
          aggregateVersion: metadata.aggregateVersion ?? 0,
          metadata: metadata.extras ?? {},
        })
        .onConflictDoNothing();
    }
  }

  async claimBatch(workerId: string, limit: number, leaseMs: number): Promise<OutboxMessage[]> {
    const staleBefore = new Date(Date.now() - leaseMs);
    const rows = await this.db.transaction(async (tx) => {
      const candidates = await tx
        .select({ id: outboxEvents.id })
        .from(outboxEvents)
        .where(
          or(
            and(eq(outboxEvents.status, 'pending'), lte(outboxEvents.availableAt, new Date())),
            and(eq(outboxEvents.status, 'processing'), lte(outboxEvents.lockedAt, staleBefore)),
          ),
        )
        .orderBy(outboxEvents.createdAt)
        .limit(limit)
        .for('update', { skipLocked: true });

      if (candidates.length === 0) return [] as ClaimedRow[];
      const ids = candidates.map((candidate) => candidate.id);
      const placeholders = ids.map((id) => sql`${id}`);
      return tx
        .update(outboxEvents)
        .set({
          status: 'processing',
          attempts: sql`${outboxEvents.attempts} + 1`,
          lockedAt: new Date(),
          lockToken: workerId,
        })
        .where(sql`${outboxEvents.id} IN (${sql.join(placeholders, sql`, `)})`)
        .returning({
          id: outboxEvents.id,
          eventName: outboxEvents.eventName,
          aggregateId: outboxEvents.aggregateId,
          aggregateType: outboxEvents.aggregateType,
          payload: outboxEvents.payload,
          attempts: outboxEvents.attempts,
          occurredAt: outboxEvents.occurredAt,
        }) as unknown as Promise<ClaimedRow[]>;
    });

    return rows.map((row) => ({
      id: row.id,
      attempts: row.attempts,
      event: {
        ...(row.payload as Record<string, unknown>),
        eventId: row.id,
        eventName: row.eventName,
        aggregateId: row.aggregateId,
        aggregateType: row.aggregateType,
        occurredAt: new Date(row.occurredAt),
      } as unknown as DomainEvent,
    }));
  }

  async markPublished(id: string, workerId: string): Promise<void> {
    await this.db
      .update(outboxEvents)
      .set({
        status: 'published',
        publishedAt: new Date(),
        lockedAt: null,
        lockToken: null,
      })
      .where(and(eq(outboxEvents.id, id), eq(outboxEvents.lockToken, workerId)));
  }

  async markFailed(id: string, workerId: string, error: string, retryAt: Date): Promise<void> {
    await this.db
      .update(outboxEvents)
      .set({
        status: 'pending',
        availableAt: retryAt,
        lastError: error.slice(0, 2000),
        lockedAt: null,
        lockToken: null,
      })
      .where(and(eq(outboxEvents.id, id), eq(outboxEvents.lockToken, workerId)));
  }
}