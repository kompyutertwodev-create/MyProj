import { z } from 'zod';

export const CancelSubscriptionRequestSchema = z.object({
  cancelAtPeriodEnd: z.boolean().optional(),
  reason: z.string().optional(),
});
export type CancelSubscriptionRequest = z.infer<typeof CancelSubscriptionRequestSchema>;
