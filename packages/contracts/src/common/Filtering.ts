import { z } from 'zod';

export const DateRangeFilterSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
export type DateRangeFilter = z.infer<typeof DateRangeFilterSchema>;

export const SearchFilterSchema = z.object({
  query: z.string().optional(),
});
export type SearchFilter = z.infer<typeof SearchFilterSchema>;

export const FilteringRequestSchema = z.object({
  search: z.string().optional(),
  dateRange: DateRangeFilterSchema.optional(),
});
export type FilteringRequest = z.infer<typeof FilteringRequestSchema>;
