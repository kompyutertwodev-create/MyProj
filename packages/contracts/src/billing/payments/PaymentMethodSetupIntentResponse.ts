import { z } from 'zod';

export const PaymentMethodSetupIntentResponseSchema = z.object({
  clientSecret: z.string(),
});
export type PaymentMethodSetupIntentResponse = z.infer<
  typeof PaymentMethodSetupIntentResponseSchema
>;
