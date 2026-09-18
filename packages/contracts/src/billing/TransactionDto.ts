import { z } from 'zod';

export const TransactionDtoSchema = z.object({
  id: z.string(),
  type: z.enum(['credit', 'debit']),
  amount: z.number(),
  currency: z.string(),
  description: z.string().optional(),
  createdAt: z.string().datetime(),
});
export type TransactionDto = z.infer<typeof TransactionDtoSchema>;
