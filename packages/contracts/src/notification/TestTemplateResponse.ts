import { z } from 'zod';

export const TestTemplateResponseSchema = z.object({
  sent: z.literal(true),
});
export type TestTemplateResponse = z.infer<typeof TestTemplateResponseSchema>;
