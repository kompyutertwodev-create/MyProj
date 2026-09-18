import { z } from 'zod';

export const UpdateMetadataRequestSchema = z.object({
  metadata: z.record(z.unknown()),
});

export type UpdateMetadataRequest = z.infer<typeof UpdateMetadataRequestSchema>;
