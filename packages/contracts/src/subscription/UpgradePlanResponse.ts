import { z } from 'zod';

export const UpgradePlanResponseSchema = z.object({
  upgraded: z.literal(true),
  proration: z.number(),
});
export type UpgradePlanResponse = z.infer<typeof UpgradePlanResponseSchema>;
