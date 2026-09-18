import { z } from 'zod';

export const GetTemplatesQuerySchema = z.object({
  type: z.string().optional(),
});
export type GetTemplatesQuery = z.infer<typeof GetTemplatesQuerySchema>;
