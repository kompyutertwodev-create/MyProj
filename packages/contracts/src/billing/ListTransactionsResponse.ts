import { z } from 'zod';
import { paginatedResponseSchema } from '../common/Pagination';
import { TransactionDtoSchema } from './TransactionDto';

export const ListTransactionsResponseSchema = paginatedResponseSchema(TransactionDtoSchema);
export type ListTransactionsResponse = z.infer<typeof ListTransactionsResponseSchema>;
