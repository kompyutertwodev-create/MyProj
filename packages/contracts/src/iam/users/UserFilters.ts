import { z } from 'zod';

export const UserFiltersSchema = z.object({
  status: z.enum(['active', 'suspended', 'banned']).optional(),
  role: z.string().optional(),
  search: z.string().optional(),
});
export type UserFilters = z.infer<typeof UserFiltersSchema>;
