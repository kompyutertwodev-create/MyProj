import { and, eq, lte, or, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { DomainEvent } from '@workspace/kernel';
import type { OutboxMessage, OutboxStore } from '@workspace/platform';
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

export class DrizzleOutboxRepository implements OutboxStore {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly db: NodePgDatabase<any>) {}

  async enqueue(event: DomainEvent): Promise<void> {
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
      })
      .onConflictDoNothing();
  }

  async enqueueAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) await this.enqueue(event);
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
            and(eq(outboxEvents.status, 'processing'), lte(outboxEvents.lockedAt, staleBefore))
          )
        )
        .orderBy(outboxEvents.createdAt)
        .limit(limit)
        .for('update', { skipLocked: true });

      if (candidates.length === 0) return [] as ClaimedRow[];
      const ids = candidates.map((candidate) => candidate.id);
      return tx
        .update(outboxEvents)
        .set({
          status: 'processing',
          attempts: sql`${outboxEvents.attempts} + 1`,
          lockedAt: new Date(),
          lockToken: workerId,
        })
        .where(
          sql`${outboxEvents.id} IN (${sql.join(
            ids.map((id) => sql`${id}`),
            sql`, `
          )})`
        )
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
