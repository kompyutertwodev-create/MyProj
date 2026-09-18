import { z } from 'zod';

export const CdnStatusResponseSchema = z.object({
  status: z.string(),
  regions: z.array(z.string()),
});
export type CdnStatusResponse = z.infer<typeof CdnStatusResponseSchema>;
