import { z } from 'zod';

export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: z
      .object({
        requestId: z.string().optional(),
        timestamp: z.string().datetime().optional(),
      })
      .optional(),
  });
