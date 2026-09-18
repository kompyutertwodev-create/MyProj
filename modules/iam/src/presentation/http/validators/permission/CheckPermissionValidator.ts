import { z } from 'zod';

export const CheckPermissionRequestSchema = z.object({
  body: z.object({
    userId: z.string().min(1, 'User ID is required'),
    permission: z
      .string()
      .min(1, 'Permission is required')
      .regex(
        /^[a-z0-9:_]+$/,
        'Permission must contain only lowercase letters, numbers, colons, dots, and underscores'
      )
      .max(255, 'Permission too long'),
  }),
});

export type CheckPermissionRequest = z.infer<typeof CheckPermissionRequestSchema>;
