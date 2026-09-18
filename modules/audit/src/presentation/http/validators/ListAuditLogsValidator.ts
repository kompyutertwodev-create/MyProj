import { z } from 'zod';
import { AuditEventType } from '../../../domain/AuditEventType.js';

export const ListAuditLogsRequestSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    actorId: z.string().max(255).optional(),
    tenantId: z.string().max(255).optional(),
    eventType: z.nativeEnum(AuditEventType).optional(),
    targetType: z.string().max(100).optional(),
    targetId: z.string().max(255).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  }),
});

export type ListAuditLogsRequest = z.infer<typeof ListAuditLogsRequestSchema>;
