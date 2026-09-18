import { z } from 'zod';

export const AssignRoleRequestSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID format'),
  }),
  body: z.object({
    roleName: z
      .string()
      .min(1, 'Role name is required')
      .max(100, 'Role name too long')
      .regex(
        /^[a-z0-9_]+$/,
        'Role name must contain only lowercase letters, numbers, and underscores'
      ),
  }),
});

export type AssignRoleRequest = z.infer<typeof AssignRoleRequestSchema>;
