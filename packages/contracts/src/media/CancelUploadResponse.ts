import { z } from 'zod';

export const CancelUploadResponseSchema = z.object({
  cancelled: z.literal(true),
});
export type CancelUploadResponse = z.infer<typeof CancelUploadResponseSchema>;
