import { z } from 'zod';

export const CheckPermissionRequestSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid user ID format'),
    permission: z
      .string()
      .min(1, 'Permission is required')
      .regex(
        /^[a-z0-9._]+$/,
        'Permission must contain only lowercase letters, numbers, dots, and underscores'
      )
      .max(255, 'Permission too long'),
  }),
});

export type CheckPermissionRequest = z.infer<typeof CheckPermissionRequestSchema>;
