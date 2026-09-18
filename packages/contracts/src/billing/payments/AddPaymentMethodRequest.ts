import { z } from 'zod';
import { BillingAddressSchema } from './PaymentMethodDto';

export const AddPaymentMethodRequestSchema = z.object({
  type: z.enum(['card', 'paypal', 'bank']),
  token: z.string(),
  setDefault: z.boolean().optional(),
  billingAddress: BillingAddressSchema.optional(),
});
export type AddPaymentMethodRequest = z.infer<typeof AddPaymentMethodRequestSchema>;
