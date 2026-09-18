import { z } from 'zod';

export const CreateTenantRequestSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  ownerId: z.string(),
  settings: z.record(z.string(), z.unknown()).optional(),
});
export type CreateTenantRequest = z.infer<typeof CreateTenantRequestSchema>;
