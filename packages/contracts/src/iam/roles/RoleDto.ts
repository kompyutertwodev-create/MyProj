import { z } from 'zod';
import { PermissionDtoSchema } from '../permissions/PermissionDto.js';

export const RoleDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  permissions: z.array(PermissionDtoSchema).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type RoleDto = z.infer<typeof RoleDtoSchema>;
