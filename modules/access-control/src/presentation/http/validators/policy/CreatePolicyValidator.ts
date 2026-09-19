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

/**
 * Request schema for `POST /policies`.
 *
 * `subjects` / `resources` / `actions` are arrays of matchers; the
 * aggregate enforces their non-emptiness. `conditions` are the ABAC
 * attribute checks evaluated after the subject/resource/action match.
 */
export const CreatePolicyRequestSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(1000).optional().default(''),
    effect: z.enum(['allow', 'deny']),
    subjects: z.array(z.string().min(1)).min(1),
    resources: z.array(z.string().min(1)).min(1),
    actions: z.array(z.string().min(1)).min(1),
    conditions: z.array(AttributeConditionSchema).optional().default([]),
    priority: z.number().int().min(0).max(10000).optional().default(100),
    isActive: z.boolean().optional().default(true),
    createdBy: z.string().min(1),
    tenantId: z.string().uuid().nullable().optional(),
  }),
});