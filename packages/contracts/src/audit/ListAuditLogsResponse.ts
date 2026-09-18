import { z } from 'zod';
import { AuditLogDtoSchema } from './AuditLogDto.js';

export const ListAuditLogsResponseSchema = z.object({
  data: z.array(AuditLogDtoSchema),
  page: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});
export type ListAuditLogsResponse = z.infer<typeof ListAuditLogsResponseSchema>;
