import { z } from 'zod';

export const TemplateDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['email', 'push', 'sms']),
  subject: z.string().optional(),
  body: z.string(),
  variables: z.array(z.string()),
  isActive: z.boolean(),
});
export type TemplateDto = z.infer<typeof TemplateDtoSchema>;
