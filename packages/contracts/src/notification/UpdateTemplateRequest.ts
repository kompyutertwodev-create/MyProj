import { z } from 'zod';

export const UpdateTemplateRequestSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['email', 'push', 'sms']).optional(),
  subject: z.string().optional(),
  body: z.string().min(1).optional(),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateTemplateRequest = z.infer<typeof UpdateTemplateRequestSchema>;
