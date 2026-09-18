import { z } from 'zod';

export const GetContentByMaturityRequestSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
});
export type GetContentByMaturityRequest = z.infer<typeof GetContentByMaturityRequestSchema>;
