import { z } from 'zod';

export const ListUsersRequestSchema = z.object({
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  status: z.enum(['active', 'suspended', 'banned']).optional(),
  role: z.string().optional(),
  sort: z.string().optional(),
});
export type ListUsersRequest = z.infer<typeof ListUsersRequestSchema>;
