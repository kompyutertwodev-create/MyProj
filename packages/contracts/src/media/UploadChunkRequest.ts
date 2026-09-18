import { z } from 'zod';

export const UploadChunkRequestSchema = z.object({
  uploadId: z.string(),
  chunkNumber: z.number().int(),
  totalChunks: z.number().int(),
});
export type UploadChunkRequest = z.infer<typeof UploadChunkRequestSchema>;
