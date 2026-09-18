import { z } from 'zod';
import { TransactionDtoSchema } from './TransactionDto';

export const GetTransactionResponseSchema = z.object({
  transaction: TransactionDtoSchema,
});
export type GetTransactionResponse = z.infer<typeof GetTransactionResponseSchema>;
