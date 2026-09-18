import { z } from 'zod';

export const ExportDataRequestSchema = z.object({
  format: z.enum(['json', 'csv']),
  include: z.array(z.enum(['profile', 'history', 'watchlist'])),
});
export type ExportDataRequest = z.infer<typeof ExportDataRequestSchema>;
