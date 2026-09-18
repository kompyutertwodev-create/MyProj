import { z } from 'zod';

export const CheckFeatureAccessResponseSchema = z.object({
  hasAccess: z.boolean(),
});
export type CheckFeatureAccessResponse = z.infer<typeof CheckFeatureAccessResponseSchema>;
