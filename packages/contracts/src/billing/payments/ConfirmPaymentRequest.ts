import { z } from 'zod';

export const ConfirmPaymentRequestSchema = z.object({
  paymentIntentId: z.string(),
});
export type ConfirmPaymentRequest = z.infer<typeof ConfirmPaymentRequestSchema>;
