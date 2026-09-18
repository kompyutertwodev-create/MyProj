import { z } from 'zod';

export const PayInvoiceResponseSchema = z.object({
  paid: z.literal(true),
  paymentId: z.string(),
});
export type PayInvoiceResponse = z.infer<typeof PayInvoiceResponseSchema>;
