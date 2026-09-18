import { z } from 'zod';

export const ResumeSubscriptionResponseSchema = z.object({
  resumed: z.literal(true),
  nextBillingAt: z.string().datetime(),
});
export type ResumeSubscriptionResponse = z.infer<typeof ResumeSubscriptionResponseSchema>;
