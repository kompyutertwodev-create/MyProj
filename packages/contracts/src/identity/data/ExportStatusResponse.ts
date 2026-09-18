import { z } from 'zod';

export const ExportStatusResponseSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  downloadUrl: z.string().optional(),
});
export type ExportStatusResponse = z.infer<typeof ExportStatusResponseSchema>;
