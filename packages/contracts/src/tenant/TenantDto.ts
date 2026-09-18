import { z } from 'zod';

export const TenantDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  ownerId: z.string(),
  status: z.enum(['active', 'suspended', 'deleted']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type TenantDto = z.infer<typeof TenantDtoSchema>;
