import { z } from 'zod';

export const UpdateMediaMetadataRequestSchema = z.object({
  isDefault: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type UpdateMediaMetadataRequest = z.infer<typeof UpdateMediaMetadataRequestSchema>;
