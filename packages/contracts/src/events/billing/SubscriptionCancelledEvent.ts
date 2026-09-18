import { z } from 'zod';

export const SubscriptionCancelledEventSchema = z.object({
  eventId: z.string(),
  subscriptionId: z.string(),
  userId: z.string(),
  reason: z.string().optional(),
  occurredAt: z.string().datetime(),
});
export type SubscriptionCancelledEvent = z.infer<typeof SubscriptionCancelledEventSchema>;
