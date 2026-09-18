import { z } from 'zod';

export const GetPlansRequestSchema = z.object({
  active: z.boolean().optional(),
});
export type GetPlansRequest = z.infer<typeof GetPlansRequestSchema>;
