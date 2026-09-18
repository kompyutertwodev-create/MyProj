import { z } from 'zod';

export const ExportDataResponseSchema = z.object({
  jobId: z.string(),
  estimatedTime: z.string(),
});
export type ExportDataResponse = z.infer<typeof ExportDataResponseSchema>;
