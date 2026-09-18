import { z } from 'zod';

export const PublishContentRequestSchema = z.object({
  scheduleAt: z.string().datetime().optional(),
});

export type PublishContentRequest = z.infer<typeof PublishContentRequestSchema>;
