import { z } from 'zod';

export const SubscriptionCreatedEventSchema = z.object({
  eventId: z.string(),
  subscriptionId: z.string(),
  userId: z.string(),
  planId: z.string(),
  occurredAt: z.string().datetime(),
});
export type SubscriptionCreatedEvent = z.infer<typeof SubscriptionCreatedEventSchema>;
