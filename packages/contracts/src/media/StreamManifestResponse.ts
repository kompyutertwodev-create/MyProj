import { z } from 'zod';

export const StreamManifestResponseSchema = z.object({
  manifest: z.string(),
});
export type StreamManifestResponse = z.infer<typeof StreamManifestResponseSchema>;
