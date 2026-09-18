import { z } from 'zod';

export const HistoryResponseSchema = z.object({
  data: z.array(z.unknown()),
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
});
export type HistoryResponse = z.infer<typeof HistoryResponseSchema>;
