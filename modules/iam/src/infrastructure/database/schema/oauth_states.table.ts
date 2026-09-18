import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const oauthStates = pgTable('iam_oauth_states', {
  state: text('state').primaryKey(),
  provider: text('provider').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type OAuthStateRow = typeof oauthStates.$inferSelect;
