import { z } from 'zod';

export const DowngradePlanRequestSchema = z.object({
  planId: z.string(),
});
export type DowngradePlanRequest = z.infer<typeof DowngradePlanRequestSchema>;
