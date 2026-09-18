import { z } from 'zod';

export const UploadProgressResponseSchema = z.object({
  progress: z.number(),
  status: z.string(),
});
export type UploadProgressResponse = z.infer<typeof UploadProgressResponseSchema>;
