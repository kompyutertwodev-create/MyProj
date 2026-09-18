import { z } from 'zod';

const ConditionSchema = z.record(z.unknown());

export const CreatePolicyRequestSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(255, 'Name too long')
      .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name contains invalid characters'),
    description: z.string().max(1000).optional().default(''),
    effect: z.enum(['allow', 'deny']),
    subjects: z
      .array(z.string().min(1))
      .min(1, 'At least one subject is required')
      .max(100, 'Too many subjects'),
    resources: z
      .array(z.string().min(1))
      .min(1, 'At least one resource is required')
      .max(100, 'Too many resources'),
    actions: z
      .array(z.string().min(1))
      .min(1, 'At least one action is required')
      .max(100, 'Too many actions'),
    conditions: z.array(ConditionSchema).optional().default([]),
    priority: z.number().int().min(0).max(1000).default(100),
    isActive: z.boolean().default(true),
  }),
});

export type CreatePolicyRequest = z.infer<typeof CreatePolicyRequestSchema>;
