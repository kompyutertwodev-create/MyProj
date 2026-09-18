import { z } from 'zod';

export const ImportContentResponseSchema = z.object({
  jobId: z.string(),
  imported: z.number().int(),
});

export type ImportContentResponse = z.infer<typeof ImportContentResponseSchema>;
