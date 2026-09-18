import { z } from 'zod';

export const DowngradePlanResponseSchema = z.object({
  downgraded: z.literal(true),
  effectiveAt: z.string().datetime(),
});
export type DowngradePlanResponse = z.infer<typeof DowngradePlanResponseSchema>;
