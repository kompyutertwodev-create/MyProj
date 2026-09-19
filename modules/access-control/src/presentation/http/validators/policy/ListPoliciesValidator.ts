import { z } from 'zod';

/** Request schema for `GET /policies`. */
export const ListPoliciesRequestSchema = z.object({
  query: z.object({
    onlyActive: z
      .union([z.boolean(), z.enum(['true', 'false'])])
      .transform((v) => (typeof v === 'boolean' ? v : v === 'true'))
      .optional(),
    tenantId: z.string().uuid().nullable().optional(),
    search: z.string().optional(),
  }),
});