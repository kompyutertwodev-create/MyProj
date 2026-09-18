import { z } from 'zod';

export const ConfirmPaymentResponseSchema = z.object({
  confirmed: z.literal(true),
});
export type ConfirmPaymentResponse = z.infer<typeof ConfirmPaymentResponseSchema>;
