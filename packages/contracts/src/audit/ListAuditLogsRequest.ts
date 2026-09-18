import { z } from 'zod';

export const ListAuditLogsRequestSchema = z.object({
  actorId: z.string().optional(),
  action: z.string().optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});
export type ListAuditLogsRequest = z.infer<typeof ListAuditLogsRequestSchema>;
