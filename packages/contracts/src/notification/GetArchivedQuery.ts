import { z } from 'zod';

export const GetArchivedQuerySchema = z.object({
  page: z.number().int().optional(),
  limit: z.number().int().optional(),
});
export type GetArchivedQuery = z.infer<typeof GetArchivedQuerySchema>;
