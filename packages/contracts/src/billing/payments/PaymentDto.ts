import { z } from 'zod';

export const PaymentDtoSchema = z.object({
  id: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum(['pending', 'succeeded', 'failed', 'refunded']),
  paymentMethodId: z.string().optional(),
  invoiceId: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type PaymentDto = z.infer<typeof PaymentDtoSchema>;
