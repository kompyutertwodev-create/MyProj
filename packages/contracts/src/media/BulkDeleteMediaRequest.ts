import { z } from 'zod';

export const BulkDeleteMediaRequestSchema = z.object({
  ids: z.array(z.string()),
});
export type BulkDeleteMediaRequest = z.infer<typeof BulkDeleteMediaRequestSchema>;
