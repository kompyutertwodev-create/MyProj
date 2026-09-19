import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Short-lived OAuth state records.
 *
 * State is a random opaque string produced by the initiating endpoint and
 * consumed exactly once by the callback. The row is deleted on consumption;
 * expired rows are swept periodically.
 */
export const oauthStates = pgTable(
  'iam_oauth_states',
  {
    state: text('state').primaryKey(),
    provider: text('provider').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    expiresIdx: index('iam_oauth_states_expires_idx').on(table.expiresAt),
  }),
);

export type OAuthStateRow = typeof oauthStates.$inferSelect;