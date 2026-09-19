import { z } from 'zod';

/**
 * Request schema for `POST /roles`.
 *
 * `actorId` is accepted on the body for now вЂ” once `apps/api` exposes the
 * authenticated user via a typed request extension this can move to the
 * auth guard.
 */
export const CreateRoleRequestSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional().default(''),
    permissionNames: z.array(z.string().min(1)).optional().default([]),
    roleId: z.string().uuid().optional(),
    isSystem: z.boolean().optional().default(false),
    tenantId: z.string().uuid().nullable().optional(),
    actorId: z.string().min(1),
  }),
});