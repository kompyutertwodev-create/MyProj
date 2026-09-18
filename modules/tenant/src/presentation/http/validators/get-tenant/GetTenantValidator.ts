import { z } from 'zod';

export const GetTenantRequestSchema = z.object({
  params: z.object({
    tenantId: z.string().min(1),
  }),
});

export type GetTenantRequest = z.infer<typeof GetTenantRequestSchema>;
