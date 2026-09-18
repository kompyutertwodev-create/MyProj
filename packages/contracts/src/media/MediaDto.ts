import { z } from 'zod';

export const MediaDtoSchema = z.object({
  id: z.string(),
  url: z.string(),
  type: z.enum(['video', 'image', 'subtitle', 'audio', 'thumbnail']),
  format: z.string(),
  size: z.number(),
  quality: z.string().optional(),
  isDefault: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
});
export type MediaDto = z.infer<typeof MediaDtoSchema>;
