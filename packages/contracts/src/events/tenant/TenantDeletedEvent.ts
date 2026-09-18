import { z } from 'zod';

export const TenantDeletedEventSchema = z.object({
  eventId: z.string(),
  tenantId: z.string(),
  deletedBy: z.string().optional(),
  occurredAt: z.string().datetime(),
});
export type TenantDeletedEvent = z.infer<typeof TenantDeletedEventSchema>;
