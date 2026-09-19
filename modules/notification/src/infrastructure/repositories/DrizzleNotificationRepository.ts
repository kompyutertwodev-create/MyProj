import { and, desc, eq, gte, lte, sql, type SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Notification } from '../../domain/Notification.js';
import type { NotificationChannel } from '../../domain/NotificationChannel.js';
import type { NotificationStatus } from '../../domain/NotificationStatus.js';
import type {
  NotificationFilter,
  NotificationRepository,
} from '../../domain/repositories/NotificationRepository.js';
import { NotificationMapper } from '../mappers/NotificationMapper.js';
import { notifications } from '../database/schema/notifications.table.js';

export class DrizzleNotificationRepository implements NotificationRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly db: NodePgDatabase<any>) {}

  async findById(id: string): Promise<Notification | null> {
    const rows = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return this.toDomain(row);
  }

  async findAll(
    filter: NotificationFilter,
    options: { limit: number; offset: number }
  ): Promise<Notification[]> {
    const where = this.buildWhere(filter);
    const rows = await this.db
      .select()
      .from(notifications)
      .where(where)
      .orderBy(desc(notifications.createdAt))
      .limit(options.limit)
      .offset(options.offset);

    return rows.map((row) => this.toDomain(row));
  }

  async countAll(filter: NotificationFilter): Promise<number> {
    const where = this.buildWhere(filter);
    const rows = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(where);
    return rows[0]?.count ?? 0;
  }

  async save(notification: Notification): Promise<void> {
    const row = NotificationMapper.toPersistence(notification);
    await this.db
      .insert(notifications)
      .values({
        id: row.id,
        recipientId: row.recipientId,
        channel: row.channel,
        contactValue: row.contactValue,
        status: row.status,
        subject: row.subject,
        body: row.body,
        templateKey: row.templateKey,
        metadata: row.metadata,
        errorMessage: row.errorMessage,
        sentAt: row.sentAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })
      .onConflictDoUpdate({
        target: notifications.id,
        set: {
          status: row.status,
          errorMessage: row.errorMessage,
          sentAt: row.sentAt,
          updatedAt: row.updatedAt,
        },
      });
  }

  async saveMany(list: Notification[]): Promise<void> {
    for (const n of list) {
      await this.save(n);
    }
  }

  private buildWhere(filter: NotificationFilter): SQL<unknown> | undefined {
    const conditions: SQL<unknown>[] = [];
    if (filter.recipientId) conditions.push(eq(notifications.recipientId, filter.recipientId));
    if (filter.channel) conditions.push(eq(notifications.channel, filter.channel));
    if (filter.status) conditions.push(eq(notifications.status, filter.status));
    if (filter.from) conditions.push(gte(notifications.createdAt, filter.from));
    if (filter.to) conditions.push(lte(notifications.createdAt, filter.to));

    if (conditions.length === 0) return undefined;
    if (conditions.length === 1) return conditions[0];
    return and(...conditions);
  }

  private toDomain(row: typeof notifications.$inferSelect): Notification {
    return NotificationMapper.toDomain({
      id: row.id,
      recipientId: row.recipientId,
      channel: row.channel as NotificationChannel,
      contactValue: row.contactValue,
      status: row.status as NotificationStatus,
      subject: row.subject,
      body: row.body,
      templateKey: row.templateKey,
      metadata: row.metadata,
      errorMessage: row.errorMessage,
      sentAt: row.sentAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
