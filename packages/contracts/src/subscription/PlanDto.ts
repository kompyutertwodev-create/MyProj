import { z } from 'zod';

export const PlanDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  price: z.number(),
  currency: z.string(),
  interval: z.string(),
  features: z.array(z.string()),
  trialDays: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
});
export type PlanDto = z.infer<typeof PlanDtoSchema>;
