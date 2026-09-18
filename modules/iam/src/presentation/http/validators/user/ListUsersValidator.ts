import { z } from 'zod';

export const ListUsersRequestSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().max(255).optional().nullable(),
    role: z.string().max(100).optional(),
    isActive: z.boolean().optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'email', 'name']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});

export type ListUsersRequest = z.infer<typeof ListUsersRequestSchema>;
