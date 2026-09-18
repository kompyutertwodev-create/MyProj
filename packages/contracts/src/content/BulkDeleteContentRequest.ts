import { z } from 'zod';

export const BulkDeleteContentRequestSchema = z.object({
  ids: z.array(z.string()),
});

export type BulkDeleteContentRequest = z.infer<typeof BulkDeleteContentRequestSchema>;
