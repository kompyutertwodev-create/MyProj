import { z } from 'zod';

export const BatchContentRequestSchema = z.object({
  ids: z.array(z.string()),
});
export type BatchContentRequest = z.infer<typeof BatchContentRequestSchema>;
