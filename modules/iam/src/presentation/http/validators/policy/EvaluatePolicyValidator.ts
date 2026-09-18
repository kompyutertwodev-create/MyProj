import { z } from 'zod';

export const EvaluatePolicyRequestSchema = z.object({
  userId: z.string().uuid('Invalid user ID format').optional(),
  resource: z.string().min(1, 'Resource is required').max(500, 'Resource too long'),
  action: z
    .string()
    .min(1, 'Action is required')
    .max(100, 'Action too long')
    .regex(
      /^[a-z0-9._]+$/,
      'Action must contain only lowercase letters, numbers, dots, and underscores'
    ),
  context: z.record(z.unknown()).optional().default({}),
});

export type EvaluatePolicyRequest = z.infer<typeof EvaluatePolicyRequestSchema>;
