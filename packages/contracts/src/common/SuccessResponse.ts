import { z } from 'zod';

export const SuccessResponseSchema = z.object({
  message: z.string(),
});
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
