import { z } from 'zod';

export const AuditLogDtoSchema = z.object({
  id: z.string(),
  actorId: z.string().optional(),
  action: z.string(),
  resourceType: z.string(),
  resourceId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().datetime(),
});
export type AuditLogDto = z.infer<typeof AuditLogDtoSchema>;
