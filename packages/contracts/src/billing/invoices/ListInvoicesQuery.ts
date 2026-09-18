import { z } from 'zod';

export const ListInvoicesQuerySchema = z.object({
  status: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.number().int().optional(),
  limit: z.number().int().optional(),
});
export type ListInvoicesQuery = z.infer<typeof ListInvoicesQuerySchema>;
