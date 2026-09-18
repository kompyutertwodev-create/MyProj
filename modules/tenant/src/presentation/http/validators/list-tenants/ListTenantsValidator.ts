import { z } from 'zod';
import { TenantStatus } from '../../../../domain/TenantStatus.js';

export const ListTenantsRequestSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().max(255).optional().nullable(),
    status: z.nativeEnum(TenantStatus).optional(),
  }),
});

export type ListTenantsRequest = z.infer<typeof ListTenantsRequestSchema>;
