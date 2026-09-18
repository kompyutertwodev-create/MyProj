import { z } from 'zod';

export const ProcessPaymentRequestSchema = z.object({
  invoiceId: z.string(),
  paymentMethodId: z.string().optional(),
  amount: z.number(),
  currency: z.string(),
});
export type ProcessPaymentRequest = z.infer<typeof ProcessPaymentRequestSchema>;
