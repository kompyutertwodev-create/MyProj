import { z } from 'zod';

export const RemovePaymentMethodResponseSchema = z.object({
  removed: z.literal(true),
});
export type RemovePaymentMethodResponse = z.infer<typeof RemovePaymentMethodResponseSchema>;
