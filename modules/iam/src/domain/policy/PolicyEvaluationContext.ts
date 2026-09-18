/**
 * All runtime attributes available during policy evaluation.
 *
 * Passed to PolicyService.evaluate() by the application layer.
 * The keys match the dot-paths used in AttributeCondition.attribute.
 */
export interface PolicyEvaluationContext {
  subject: {
    id: string;
    roles: string[];
    /** e.g. "premium", "free", "enterprise" */
    tier?: string;
    tenantId?: string;
    [key: string]: unknown;
  };
  resource: {
    type: string;
    id?: string;
    /** e.g. owner of a piece of content */
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

/** Flatten a PolicyEvaluationContext into a single-level Record for condition evaluation. */
export function flattenContext(ctx: PolicyEvaluationContext): Record<string, unknown> {
  return {
    ...Object.fromEntries(Object.entries(ctx.subject).map(([k, v]) => [`subject.${k}`, v])),
    ...Object.fromEntries(Object.entries(ctx.resource).map(([k, v]) => [`resource.${k}`, v])),
    ...Object.fromEntries(
      Object.entries(ctx.environment ?? {}).map(([k, v]) => [`environment.${k}`, v])
    ),
  };
}
