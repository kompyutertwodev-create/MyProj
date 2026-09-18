import { z } from 'zod';

export const SubscriptionDtoSchema = z.object({
  id: z.string(),
  planId: z.string(),
  status: z.enum(['active', 'inactive', 'canceled', 'past_due', 'trialing']),
  currentPeriodStart: z.string().datetime(),
  currentPeriodEnd: z.string().datetime(),
  cancelAtPeriodEnd: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type SubscriptionDto = z.infer<typeof SubscriptionDtoSchema>;
