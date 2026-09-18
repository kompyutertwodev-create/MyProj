import { z } from 'zod';

export const CreatePaymentIntentRequestSchema = z.object({
  amount: z.number(),
  currency: z.string(),
  description: z.string(),
  metadata: z.record(z.unknown()),
});
export type CreatePaymentIntentRequest = z.infer<typeof CreatePaymentIntentRequestSchema>;
