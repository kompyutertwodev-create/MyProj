import { z } from 'zod';

export const UpdatePlanRequestSchema = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  price: z.number().optional(),
  currency: z.string().optional(),
  interval: z.string().optional(),
  features: z.array(z.string()).optional(),
  trialDays: z.number().int().optional(),
});
export type UpdatePlanRequest = z.infer<typeof UpdatePlanRequestSchema>;
