import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { identityStatus } from '../enums/identity-status.enum.js';

export const identities = pgTable('identities', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  passwordSet: boolean('password_set').notNull().default(true),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  status: identityStatus('status').notNull().default('unverified'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type IdentityRow = typeof identities.$inferSelect;
export type NewIdentityRow = typeof identities.$inferInsert;
