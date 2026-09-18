import { z } from 'zod';

export const ProcessMediaRequestSchema = z.object({
  task: z.enum(['transcode', 'compress', 'optimize']),
  config: z.record(z.unknown()),
});
export type ProcessMediaRequest = z.infer<typeof ProcessMediaRequestSchema>;
