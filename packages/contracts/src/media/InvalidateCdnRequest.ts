import { z } from 'zod';

export const InvalidateCdnRequestSchema = z.object({
  paths: z.array(z.string()).optional(),
});
export type InvalidateCdnRequest = z.infer<typeof InvalidateCdnRequestSchema>;
