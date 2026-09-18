import { z } from 'zod';

export const GetSubscriptionHistoryRequestSchema = z.object({
  page: z.number().int().optional(),
  limit: z.number().int().optional(),
});
export type GetSubscriptionHistoryRequest = z.infer<typeof GetSubscriptionHistoryRequestSchema>;
