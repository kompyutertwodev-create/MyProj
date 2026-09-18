import { z } from 'zod';

export const CreateTenantRequestSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200),
    slug: z.string().min(3).max(63),
    ownerUserId: z.string().min(1),
    settings: z
      .object({
        locale: z.string().min(2).max(10).optional(),
        timezone: z.string().min(1).max(64).optional(),
        currency: z.string().length(3).optional(),
        logoUrl: z.string().url().nullable().optional(),
        primaryColor: z
          .string()
          .regex(/^#[0-9a-fA-F]{6}$/)
          .nullable()
          .optional(),
      })
      .optional(),
  }),
});

export type CreateTenantRequest = z.infer<typeof CreateTenantRequestSchema>;
