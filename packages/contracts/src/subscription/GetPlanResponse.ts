import { z } from 'zod';
import { PlanDtoSchema } from './PlanDto';

export const GetPlanResponseSchema = z.object({
  plan: PlanDtoSchema,
});
export type GetPlanResponse = z.infer<typeof GetPlanResponseSchema>;
