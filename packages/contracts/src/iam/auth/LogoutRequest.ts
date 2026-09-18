import { z } from 'zod';

export const LogoutRequestSchema = z.object({});
export type LogoutRequest = z.infer<typeof LogoutRequestSchema>;
