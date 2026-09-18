import { z } from 'zod';

export const CreatePaymentIntentResponseSchema = z.object({
  clientSecret: z.string(),
  paymentIntentId: z.string(),
});
export type CreatePaymentIntentResponse = z.infer<typeof CreatePaymentIntentResponseSchema>;
