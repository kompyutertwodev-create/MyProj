import { z } from 'zod';

export const StartSessionRequestSchema = z.object({
  contentId: z.string(),
  quality: z.string().optional(),
  deviceId: z.string(),
});
export type StartSessionRequest = z.infer<typeof StartSessionRequestSchema>;
