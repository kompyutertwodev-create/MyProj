import { z } from 'zod';

export const TestTemplateRequestSchema = z.object({
  email: z.string().email().optional(),
  variables: z.record(z.unknown()),
});
export type TestTemplateRequest = z.infer<typeof TestTemplateRequestSchema>;
