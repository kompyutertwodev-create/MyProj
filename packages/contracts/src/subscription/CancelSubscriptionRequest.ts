import { z } from 'zod';

export const CancelSubscriptionRequestSchema = z.object({
  reason: z.string().optional(),
});
export type CancelSubscriptionRequest = z.infer<typeof CancelSubscriptionRequestSchema>;
