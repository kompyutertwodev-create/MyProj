import { z } from 'zod';

export const PayInvoiceRequestSchema = z.object({
  paymentMethodId: z.string().optional(),
});
export type PayInvoiceRequest = z.infer<typeof PayInvoiceRequestSchema>;
