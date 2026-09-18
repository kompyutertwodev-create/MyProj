import { z } from 'zod';

export const HeartbeatRequestSchema = z.object({
  progress: z.number(),
  duration: z.number(),
});
export type HeartbeatRequest = z.infer<typeof HeartbeatRequestSchema>;
