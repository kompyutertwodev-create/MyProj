import { z } from 'zod';

export const CheckPermissionRequestSchema = z.object({
  userId: z.string(),
  permission: z.string(),
  resource: z.string().optional(),
});
export type CheckPermissionRequest = z.infer<typeof CheckPermissionRequestSchema>;
