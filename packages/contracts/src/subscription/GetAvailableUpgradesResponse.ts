import { z } from 'zod';
import { PlanDtoSchema } from './PlanDto';

export const AvailableUpgradeItemSchema = z.object({
  plan: PlanDtoSchema,
  difference: z.number(),
});
export type AvailableUpgradeItem = z.infer<typeof AvailableUpgradeItemSchema>;

export const GetAvailableUpgradesResponseSchema = z.array(AvailableUpgradeItemSchema);
export type GetAvailableUpgradesResponse = z.infer<typeof GetAvailableUpgradesResponseSchema>;
