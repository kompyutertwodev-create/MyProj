import { z } from 'zod';

export const SortOrderSchema = z.enum(['asc', 'desc']);
export type SortOrder = z.infer<typeof SortOrderSchema>;

export const SortingRequestSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: SortOrderSchema.default('asc'),
});
export type SortingRequest = z.infer<typeof SortingRequestSchema>;
