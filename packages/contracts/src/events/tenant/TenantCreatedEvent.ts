import { z } from 'zod';

export const TenantCreatedEventSchema = z.object({
  eventId: z.string(),
  tenantId: z.string(),
  name: z.string(),
  ownerId: z.string(),
  occurredAt: z.string().datetime(),
});
export type TenantCreatedEvent = z.infer<typeof TenantCreatedEventSchema>;
