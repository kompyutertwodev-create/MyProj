import { z } from 'zod';

export const ListContentRequestSchema = z.object({
  status: z.enum(['draft', 'pending', 'published', 'archived']).optional(),
  type: z.string().optional(),
  createdBy: z.string().optional(),
  page: z.number().int().optional(),
  limit: z.number().int().optional(),
});

export type ListContentRequest = z.infer<typeof ListContentRequestSchema>;
