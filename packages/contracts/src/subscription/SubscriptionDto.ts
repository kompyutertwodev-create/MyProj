import { z } from 'zod';
import { PlanDtoSchema } from './PlanDto';

export const SubscriptionDtoSchema = z.object({
  id: z.string(),
  planId: z.string(),
  plan: PlanDtoSchema,
  status: z.enum(['active', 'cancelled', 'expired', 'trial', 'pending']),
  startedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  trialEndsAt: z.string().datetime().optional(),
  autoRenew: z.boolean(),
  nextBillingAt: z.string().datetime().optional(),
  features: z.array(z.string()),
});
export type SubscriptionDto = z.infer<typeof SubscriptionDtoSchema>;
