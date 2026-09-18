import { z } from 'zod';

export const UpdatePolicyRequestSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid policy ID format'),
  }),
  body: z.object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(255, 'Name too long')
      .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name contains invalid characters')
      .optional(),
    description: z.string().max(1000).optional(),
    effect: z.enum(['allow', 'deny']).optional(),
    subjects: z
      .array(z.string().min(1))
      .min(1, 'At least one subject is required')
      .max(100, 'Too many subjects')
      .optional(),
    resources: z
      .array(z.string().min(1))
      .min(1, 'At least one resource is required')
      .max(100, 'Too many resources')
      .optional(),
    actions: z
      .array(z.string().min(1))
      .min(1, 'At least one action is required')
      .max(100, 'Too many actions')
      .optional(),
    conditions: z.array(z.record(z.unknown())).optional(),
    priority: z.number().int().min(0).max(1000).optional(),
    isActive: z.boolean().optional(),
  }),
});

export type UpdatePolicyRequest = z.infer<typeof UpdatePolicyRequestSchema>;
