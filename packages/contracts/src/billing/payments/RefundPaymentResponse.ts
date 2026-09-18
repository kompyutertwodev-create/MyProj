import { z } from 'zod';

export const RefundPaymentResponseSchema = z.object({
  refunded: z.literal(true),
  refundId: z.string(),
});
export type RefundPaymentResponse = z.infer<typeof RefundPaymentResponseSchema>;
