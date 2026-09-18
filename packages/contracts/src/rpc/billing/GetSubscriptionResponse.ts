import { z } from 'zod';

export const GetSubscriptionResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  planId: z.string(),
  status: z.enum(['trialing', 'active', 'past_due', 'cancelled', 'expired']),
  currentPeriodEnd: z.string().datetime().optional(),
});
export type GetSubscriptionResponse = z.infer<typeof GetSubscriptionResponseSchema>;
