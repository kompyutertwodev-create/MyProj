import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { DomainEvent } from '@workspace/kernel';
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
 * The `db` type is intentionally `any` вЂ” same reasoning as the other
 * repositories.
 */
export class DrizzleOutboxRepository implements OutboxPort {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly db: NodePgDatabase<any>) {}

  async enqueue(event: DomainEvent): Promise<void> {
    await this.db
      .insert(acOutboxEvents)
      .values({
        id: event.eventId,
        eventName: event.eventName,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        payload: event as unknown as Record<string, unknown>,
        occurredAt: event.occurredAt,
        createdAt: new Date(),
      })
      .onConflictDoNothing();
  }

  async enqueueAll(events: ReadonlyArray<DomainEvent>): Promise<void> {
    if (events.length === 0) return;
    await this.db
      .insert(acOutboxEvents)
      .values(
        events.map((event) => ({
          id: event.eventId,
          eventName: event.eventName,
          aggregateType: event.aggregateType,
          aggregateId: event.aggregateId,
          payload: event as unknown as Record<string, unknown>,
          occurredAt: event.occurredAt,
          createdAt: new Date(),
        })),
      )
      .onConflictDoNothing();
  }
}