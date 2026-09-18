import { z } from 'zod';

export const BulkDeleteContentResponseSchema = z.object({
  deleted: z.array(z.unknown()),
  failed: z.array(z.unknown()),
});

export type BulkDeleteContentResponse = z.infer<typeof BulkDeleteContentResponseSchema>;
