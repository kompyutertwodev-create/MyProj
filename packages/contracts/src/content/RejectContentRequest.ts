import { z } from 'zod';

export const RejectContentRequestSchema = z.object({
  reason: z.string(),
});

export type RejectContentRequest = z.infer<typeof RejectContentRequestSchema>;
