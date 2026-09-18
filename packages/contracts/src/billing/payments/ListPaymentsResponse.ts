import { z } from 'zod';
import { paginatedResponseSchema } from '../../common/Pagination';
import { PaymentDtoSchema } from './PaymentDto';

export const ListPaymentsResponseSchema = paginatedResponseSchema(PaymentDtoSchema);
export type ListPaymentsResponse = z.infer<typeof ListPaymentsResponseSchema>;
