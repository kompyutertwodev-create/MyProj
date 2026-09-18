import { z } from 'zod';

export const UpdateTenantRequestSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});
export type UpdateTenantRequest = z.infer<typeof UpdateTenantRequestSchema>;
