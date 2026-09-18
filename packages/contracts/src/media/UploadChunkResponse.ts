import { z } from 'zod';

export const UploadChunkResponseSchema = z.object({
  uploadId: z.string(),
  chunkNumber: z.number().int(),
  uploaded: z.literal(true),
});
export type UploadChunkResponse = z.infer<typeof UploadChunkResponseSchema>;
