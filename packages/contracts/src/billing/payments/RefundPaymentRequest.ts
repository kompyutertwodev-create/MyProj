import { z } from 'zod';

export const RefundPaymentRequestSchema = z.object({
  amount: z.number().optional(),
  reason: z.string(),
});
export type RefundPaymentRequest = z.infer<typeof RefundPaymentRequestSchema>;
