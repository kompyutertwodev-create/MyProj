import { z } from 'zod';
import { RoleDtoSchema } from './RoleDto.js';

export const ListRolesResponseSchema = z.object({
  data: z.array(RoleDtoSchema),
  total: z.number().int().nonnegative(),
});
export type ListRolesResponse = z.infer<typeof ListRolesResponseSchema>;
