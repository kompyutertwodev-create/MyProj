import { z } from 'zod';

export const UploadMediaRequestSchema = z.object({
  contentId: z.string(),
  type: z.enum(['video', 'image', 'subtitle', 'audio', 'thumbnail']),
  quality: z.string().optional(),
  isDefault: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type UploadMediaRequest = z.infer<typeof UploadMediaRequestSchema>;
