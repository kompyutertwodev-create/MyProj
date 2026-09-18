import { z } from 'zod';

export const ImportStatusResponseSchema = z.object({
  status: z.string(),
  progress: z.number(),
  total: z.number().int(),
  imported: z.number().int(),
  failed: z.number().int(),
});

export type ImportStatusResponse = z.infer<typeof ImportStatusResponseSchema>;
