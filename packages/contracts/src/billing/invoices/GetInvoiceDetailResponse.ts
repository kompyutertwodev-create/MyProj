import { z } from 'zod';
import { InvoiceDtoSchema, InvoiceItemSchema } from './InvoiceDto';
import { PaymentDtoSchema } from '../payments/PaymentDto';

export const GetInvoiceDetailResponseSchema = z.object({
  invoice: InvoiceDtoSchema,
  items: z.array(InvoiceItemSchema),
  payments: z.array(PaymentDtoSchema),
  subscription: z
    .object({
      id: z.string(),
      planId: z.string(),
      status: z.string(),
    })
    .optional(),
});
export type GetInvoiceDetailResponse = z.infer<typeof GetInvoiceDetailResponseSchema>;
