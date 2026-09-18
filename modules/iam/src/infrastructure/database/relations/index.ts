import { relations } from 'drizzle-orm';
import { identities } from '../schema/identities.table.js';
import { sessions } from '../schema/sessions.table.js';
import { socialIdentities } from '../schema/social_identities.table.js';

export const identityRelations = relations(identities, ({ many }) => ({
  sessions: many(sessions),
  socialIdentities: many(socialIdentities),
}));

export const sessionRelations = relations(sessions, ({ one }) => ({
  identity: one(identities, {
    fields: [sessions.identityId],
    references: [identities.id],
  }),
}));

export const socialIdentityRelations = relations(socialIdentities, ({ one }) => ({
  identity: one(identities, {
    fields: [socialIdentities.userId],
    references: [identities.id],
  }),
}));
