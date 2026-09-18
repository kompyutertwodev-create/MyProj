import { z } from 'zod';

export const CompleteUploadResponseSchema = z.object({
  mediaId: z.string(),
  url: z.string(),
});
export type CompleteUploadResponse = z.infer<typeof CompleteUploadResponseSchema>;
