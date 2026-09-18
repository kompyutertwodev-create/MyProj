import { z } from 'zod';

export const CreateSubscriptionRequestSchema = z.object({
  planId: z.string(),
  paymentMethodId: z.string().optional(),
  trialDays: z.number().int().optional(),
});
export type CreateSubscriptionRequest = z.infer<typeof CreateSubscriptionRequestSchema>;
