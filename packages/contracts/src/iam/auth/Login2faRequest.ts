import { z } from 'zod';

export const Login2faRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  code: z.string(),
});
export type Login2faRequest = z.infer<typeof Login2faRequestSchema>;
