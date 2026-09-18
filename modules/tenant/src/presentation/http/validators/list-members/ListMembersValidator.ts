import { z } from 'zod';
import { MemberRole } from '../../../../domain/MemberRole.js';
import { MemberStatus } from '../../../../domain/MemberStatus.js';

export const ListMembersRequestSchema = z.object({
  params: z.object({
    tenantId: z.string().min(1),
  }),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    role: z.nativeEnum(MemberRole).optional(),
    status: z.nativeEnum(MemberStatus).optional(),
  }),
});

export type ListMembersRequest = z.infer<typeof ListMembersRequestSchema>;
