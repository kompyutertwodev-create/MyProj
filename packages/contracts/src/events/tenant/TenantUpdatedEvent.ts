import { z } from 'zod';

export const TenantUpdatedEventSchema = z.object({
  eventId: z.string(),
  tenantId: z.string(),
  updatedBy: z.string().optional(),
  changes: z.record(z.string(), z.unknown()),
  occurredAt: z.string().datetime(),
});
export type TenantUpdatedEvent = z.infer<typeof TenantUpdatedEventSchema>;
