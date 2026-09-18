import { z } from 'zod';
import { PlanDtoSchema } from './PlanDto';

export const GetPlansResponseSchema = z.array(PlanDtoSchema);
export type GetPlansResponse = z.infer<typeof GetPlansResponseSchema>;
