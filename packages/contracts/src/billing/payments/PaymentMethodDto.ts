import { z } from 'zod';

export const BillingAddressSchema = z.object({
  line1: z.string().optional(),
  line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});
export type BillingAddress = z.infer<typeof BillingAddressSchema>;

export const PaymentMethodDtoSchema = z.object({
  id: z.string(),
  type: z.enum(['card', 'paypal', 'crypto', 'bank']),
  last4: z.string().optional(),
  brand: z.string().optional(),
  expiry: z.string().optional(),
  isDefault: z.boolean(),
  billingAddress: BillingAddressSchema.optional(),
  createdAt: z.string().datetime(),
});
export type PaymentMethodDto = z.infer<typeof PaymentMethodDtoSchema>;
