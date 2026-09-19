import { index, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const notifications = pgTable(
  'notifications',
  {
    id: text('id').primaryKey(),
    recipientId: text('recipient_id').notNull(),
    channel: text('channel').notNull(),
    contactValue: text('contact_value').notNull(),
    status: text('status').notNull(),
    subject: text('subject').notNull(),
    body: text('body').notNull(),
    templateKey: text('template_key'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
    errorMessage: text('error_message'),
    sentAt: timestamp('sent_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    recipientIdx: index('notifications_recipient_idx').on(table.recipientId),
    channelIdx: index('notifications_channel_idx').on(table.channel),
    statusIdx: index('notifications_status_idx').on(table.status),
    createdAtIdx: index('notifications_created_at_idx').on(table.createdAt),
  })
);

export type NotificationRow = typeof notifications.$inferSelect;
export type NotificationInsertRow = typeof notifications.$inferInsert;
