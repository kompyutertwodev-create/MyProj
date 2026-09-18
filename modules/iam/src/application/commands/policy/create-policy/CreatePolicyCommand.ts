import { z } from 'zod';

export const CreatePolicyCommandSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional().default(''),
  effect: z.enum(['allow', 'deny']),
  subjects: z.array(z.string().min(1)).min(1),
  resources: z.array(z.string().min(1)).min(1),
  actions: z.array(z.string().min(1)).min(1),
  conditions: z.array(z.record(z.unknown())).optional().default([]),
  priority: z.number().int().min(0).max(1000).default(100),
  isActive: z.boolean().default(true),
  createdBy: z.string().uuid().default('system'),
});

export type CreatePolicyCommand = z.infer<typeof CreatePolicyCommandSchema>;
