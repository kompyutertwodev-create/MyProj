import { z } from 'zod';

export const ApiErrorDetailSchema = z.object({
  field: z.string().optional(),
  message: z.string(),
  code: z.string().optional(),
});
export type ApiErrorDetail = z.infer<typeof ApiErrorDetailSchema>;

export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(ApiErrorDetailSchema).optional(),
  }),
  meta: z
    .object({
      requestId: z.string().optional(),
      timestamp: z.string().datetime().optional(),
    })
    .optional(),
});
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
