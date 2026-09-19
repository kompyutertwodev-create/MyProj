/**
 * All runtime attributes available during policy evaluation.
 *
 * Passed to the policy evaluator by the application layer. The keys match
 * the dot-paths used in AttributeCondition.
 */
export interface PolicyEvaluationContext {
  subject: {
    id: string;
    roles: string[];
    tier?: string;
    tenantId?: string;
    [key: string]: unknown;
  };
  resource: {
    type: string;
    id?: string;
    ownerId?: string;
    tenantId?: string;
    [key: string]: unknown;
  };
  environment?: {
    ipAddress?: string;
    userAgent?: string;
    timestamp?: string;
    [key: string]: unknown;
  };
}

/**
 * Flatten a PolicyEvaluationContext into a single-level Record so
 * conditions can address nested fields with dot-paths.
 */
export function flattenContext(ctx: PolicyEvaluationContext): Record<string, unknown> {
  const flat: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(ctx.subject)) {
    flat[`subject.${key}`] = value;
  }
  for (const [key, value] of Object.entries(ctx.resource)) {
    flat[`resource.${key}`] = value;
  }
  for (const [key, value] of Object.entries(ctx.environment ?? {})) {
    flat[`environment.${key}`] = value;
  }

  return flat;
}