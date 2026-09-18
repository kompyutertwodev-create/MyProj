import { z } from 'zod';

export const ListTenantsRequestSchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
  search: z.string().optional(),
});
export type ListTenantsRequest = z.infer<typeof ListTenantsRequestSchema>;
