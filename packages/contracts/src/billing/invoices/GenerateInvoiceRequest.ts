import { z } from 'zod';

export const GenerateInvoiceRequestSchema = z.object({
  subscriptionId: z.string().optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});
export type GenerateInvoiceRequest = z.infer<typeof GenerateInvoiceRequestSchema>;
