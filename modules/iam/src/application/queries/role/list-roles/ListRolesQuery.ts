import { z } from 'zod';

export const ListRolesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional().nullable(),
});

export type ListRolesQuery = z.infer<typeof ListRolesQuerySchema>;
