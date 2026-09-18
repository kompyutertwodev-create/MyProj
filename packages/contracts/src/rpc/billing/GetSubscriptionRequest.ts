import { z } from 'zod';

export const GetSubscriptionRequestSchema = z.object({
  userId: z.string(),
});
export type GetSubscriptionRequest = z.infer<typeof GetSubscriptionRequestSchema>;
