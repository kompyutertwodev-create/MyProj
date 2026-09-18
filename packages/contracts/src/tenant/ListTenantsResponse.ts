import { z } from 'zod';
import { TenantDtoSchema } from './TenantDto.js';

export const ListTenantsResponseSchema = z.object({
  data: z.array(TenantDtoSchema),
  page: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});
export type ListTenantsResponse = z.infer<typeof ListTenantsResponseSchema>;
