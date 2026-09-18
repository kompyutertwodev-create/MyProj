import { z } from 'zod';

export const HistoryQueryRequestSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
export type HistoryQueryRequest = z.infer<typeof HistoryQueryRequestSchema>;
