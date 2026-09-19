import { z } from 'zod';

/** Request schema for `POST /roles/:id/permissions`. */
export const AddPermissionToRoleRequestSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    permissionName: z.string().regex(/^[a-z_]+:[a-z_]+$/, 'Must be resource:action'),
    permissionDescription: z.string().max(500).optional().default(''),
    actorId: z.string().min(1),
  }),
});