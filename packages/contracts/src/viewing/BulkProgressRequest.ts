import { z } from 'zod';

export const BulkProgressRequestSchema = z.object({
  contentIds: z.array(z.string()),
});
export type BulkProgressRequest = z.infer<typeof BulkProgressRequestSchema>;
