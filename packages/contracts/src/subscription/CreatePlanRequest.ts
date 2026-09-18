import { z } from 'zod';

export const CreatePlanRequestSchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  price: z.number(),
  currency: z.string(),
  interval: z.string(),
  features: z.array(z.string()),
  trialDays: z.number().int(),
});
export type CreatePlanRequest = z.infer<typeof CreatePlanRequestSchema>;
