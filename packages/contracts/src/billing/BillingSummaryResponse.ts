import { z } from 'zod';

export const BillingSummaryResponseSchema = z.object({
  totalSpent: z.number(),
  totalInvoices: z.number().int(),
  paidInvoices: z.number().int(),
  pendingInvoices: z.number().int(),
});
export type BillingSummaryResponse = z.infer<typeof BillingSummaryResponseSchema>;
