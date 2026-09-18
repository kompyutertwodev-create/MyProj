import { z } from 'zod';

export const CompleteUploadRequestSchema = z.object({
  uploadId: z.string(),
});
export type CompleteUploadRequest = z.infer<typeof CompleteUploadRequestSchema>;
