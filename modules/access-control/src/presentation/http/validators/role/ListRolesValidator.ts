import { z } from 'zod';

/** Request schema for `GET /roles`. */
export const ListRolesRequestSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(200).optional(),
    tenantId: z.string().uuid().nullable().optional(),
    search: z.string().optional(),
  }),
});