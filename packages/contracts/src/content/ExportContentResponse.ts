import { z } from 'zod';

export const ExportContentResponseSchema = z.object({
  downloadUrl: z.string(),
});

export type ExportContentResponse = z.infer<typeof ExportContentResponseSchema>;
