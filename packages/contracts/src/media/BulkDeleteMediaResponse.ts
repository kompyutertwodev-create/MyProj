import { z } from 'zod';

export const BulkDeleteMediaResponseSchema = z.object({
  deleted: z.array(z.string()),
});
export type BulkDeleteMediaResponse = z.infer<typeof BulkDeleteMediaResponseSchema>;
