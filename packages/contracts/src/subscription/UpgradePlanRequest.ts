import { z } from 'zod';

export const UpgradePlanRequestSchema = z.object({
  planId: z.string(),
});
export type UpgradePlanRequest = z.infer<typeof UpgradePlanRequestSchema>;
