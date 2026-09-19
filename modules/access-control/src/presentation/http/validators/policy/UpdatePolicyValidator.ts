import { z } from 'zod';

const ConditionOperatorSchema = z.enum([
  'eq',
  'neq',
  'in',
  'nin',
  'gt',
  'gte',
  'lt',
  'lte',
  'contains',
  'startsWith',
  'exists',
]);

const AttributeConditionSchema = z.object({
  attribute: z.string().min(1),
  operator: ConditionOperatorSchema,
  value: z.unknown(),
});

/** Request schema for `PATCH /policies/:id`. All mutable fields are optional. */
export const UpdatePolicyRequestSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    effect: z.enum(['allow', 'deny']).optional(),
    subjects: z.array(z.string().min(1)).min(1).optional(),
    resources: z.array(z.string().min(1)).min(1).optional(),
    actions: z.array(z.string().min(1)).min(1).optional(),
    conditions: z.array(AttributeConditionSchema).optional(),
    priority: z.number().int().min(0).max(10000).optional(),
    updatedBy: z.string().min(1),
  }),
});