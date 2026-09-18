import { z } from 'zod';
import { paginatedResponseSchema } from '../../common/Pagination';
import { InvoiceDtoSchema } from './InvoiceDto';

export const ListInvoicesResponseSchema = paginatedResponseSchema(InvoiceDtoSchema);
export type ListInvoicesResponse = z.infer<typeof ListInvoicesResponseSchema>;
