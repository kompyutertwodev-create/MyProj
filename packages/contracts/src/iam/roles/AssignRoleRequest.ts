import { z } from 'zod';

export const AssignRoleRequestSchema = z.object({
  userId: z.string(),
  roleId: z.string(),
});
export type AssignRoleRequest = z.infer<typeof AssignRoleRequestSchema>;
