import {
  customType,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { identities } from './identities.table.js';

const citext = customType<{ data: string }>({
  dataType() {
    return 'citext';
  },
});

/**
 * Social identity link (OAuth providers).
 *
 * A single user may have several social identities; (provider,
 * providerUserId) is globally unique so the same external account cannot
 * be linked to two local users.
 */
export const socialIdentities = pgTable(
  'social_identities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => identities.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    providerUserId: text('provider_user_id').notNull(),
    providerEmail: citext('provider_email'),
    providerDisplayName: text('provider_display_name').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    providerUserUnique: uniqueIndex('social_identities_provider_user_unique').on(
      table.provider,
      table.providerUserId,
    ),
    userIdx: index('social_identities_user_idx').on(table.userId),
  }),
);

export type SocialIdentityRow = typeof socialIdentities.$inferSelect;
export type NewSocialIdentityRow = typeof socialIdentities.$inferInsert;