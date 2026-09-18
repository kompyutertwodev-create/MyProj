import { z } from 'zod';

export const QualityDtoSchema = z.object({
  quality: z.string(),
  bitrate: z.number(),
  resolution: z.string(),
  size: z.number(),
});
export type QualityDto = z.infer<typeof QualityDtoSchema>;
