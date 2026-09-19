import { z } from 'zod';

/** Request schema for `DELETE /roles/:id/permissions/:permissionName`. */
export const RemovePermissionFromRoleRequestSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    permissionName: z.string().regex(/^[a-z_]+:[a-z_]+$/),
  }),
  body: z.object({
    actorId: z.string().min(1),
  }),
});