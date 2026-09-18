import { z } from 'zod';

export const CancelSubscriptionResponseSchema = z.object({
  cancelled: z.literal(true),
  expiresAt: z.string().datetime(),
});
export type CancelSubscriptionResponse = z.infer<typeof CancelSubscriptionResponseSchema>;
