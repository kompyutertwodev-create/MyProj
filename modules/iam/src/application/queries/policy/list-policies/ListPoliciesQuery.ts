import { z } from 'zod';

export const ListPoliciesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional().nullable(),
  effect: z.enum(['allow', 'deny']).optional(),
  isActive: z.boolean().optional(),
});

export type ListPoliciesQuery = z.infer<typeof ListPoliciesQuerySchema>;
