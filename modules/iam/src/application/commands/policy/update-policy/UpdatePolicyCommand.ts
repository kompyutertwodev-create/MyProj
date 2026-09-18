import { z } from 'zod';

export const UpdatePolicyCommandSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  effect: z.enum(['allow', 'deny']).optional(),
  subjects: z.array(z.string().min(1)).min(1).optional(),
  resources: z.array(z.string().min(1)).min(1).optional(),
  actions: z.array(z.string().min(1)).min(1).optional(),
  conditions: z.array(z.record(z.unknown())).optional(),
  priority: z.number().int().min(0).max(1000).optional(),
  isActive: z.boolean().optional(),
});

export type UpdatePolicyCommand = z.infer<typeof UpdatePolicyCommandSchema>;
