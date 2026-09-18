import { z } from 'zod';

export const InvoiceItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  amount: z.number(),
  quantity: z.number().int(),
  unitPrice: z.number(),
});
export type InvoiceItem = z.infer<typeof InvoiceItemSchema>;

export const InvoiceDtoSchema = z.object({
  id: z.string(),
  status: z.enum(['pending', 'paid', 'failed', 'refunded']),
  amount: z.number(),
  currency: z.string(),
  dueDate: z.string().datetime().optional(),
  paidAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type InvoiceDto = z.infer<typeof InvoiceDtoSchema>;
