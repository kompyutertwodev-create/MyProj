import { z } from 'zod';

export const CreateTemplateRequestSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['email', 'push', 'sms']),
  subject: z.string().optional(),
  body: z.string().min(1),
  variables: z.array(z.string()),
});
export type CreateTemplateRequest = z.infer<typeof CreateTemplateRequestSchema>;
