import { z } from 'zod';

export const SetDefaultPaymentMethodResponseSchema = z.object({
  default: z.literal(true),
});
export type SetDefaultPaymentMethodResponse = z.infer<typeof SetDefaultPaymentMethodResponseSchema>;
