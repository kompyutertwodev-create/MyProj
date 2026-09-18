import { z } from 'zod';

export const TogglePlanResponseSchema = z.object({
  active: z.boolean(),
});
export type TogglePlanResponse = z.infer<typeof TogglePlanResponseSchema>;
