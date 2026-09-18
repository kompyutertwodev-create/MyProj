import { pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { identities } from './identities.table.js';

export const socialIdentities = pgTable(
  'social_identities',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => identities.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    providerUserId: text('provider_user_id').notNull(),
    providerEmail: text('provider_email'),
    providerDisplayName: text('provider_display_name').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    tokenExpiresAt: timestamp('token_expires_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    providerUserUnique: uniqueIndex('social_identities_provider_user_unique').on(
      t.provider,
      t.providerUserId
    ),
  })
);

export type SocialIdentityRow = typeof socialIdentities.$inferSelect;
export type NewSocialIdentityRow = typeof socialIdentities.$inferInsert;
