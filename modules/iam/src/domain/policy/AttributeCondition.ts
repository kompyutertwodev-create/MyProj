/**
 * A single attribute-based condition evaluated during policy resolution.
 *
 * Example:
 *   { attribute: "resource.ownerId", operator: "eq", value: "${subject.id}" }
 *   { attribute: "subject.tier",     operator: "in", value: ["premium","enterprise"] }
 */
export type ConditionOperator =
  | 'eq' // equals
  | 'neq' // not equals
  | 'in' // value in array
  | 'nin' // value not in array
  | 'gt' // greater than (numeric)
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains' // string contains
  | 'startsWith'
  | 'exists'; // attribute key exists in context

export interface AttributeCondition {
  /** Dot-path into the evaluation context, e.g. "subject.department" */
  attribute: string;
  operator: ConditionOperator;
  /** The expected value. Use "${subject.id}" for dynamic references. */
  value: unknown;
}

/**
 * Resolve a dot-path against a flat or nested object.
 */
export function resolvePath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc === null || acc === undefined) return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

/**
 * Evaluate a single condition against the merged evaluation context.
 * Returns true if the condition passes.
 */
export function evaluateCondition(
  condition: AttributeCondition,
  context: Record<string, unknown>
): boolean {
  const actual = resolvePath(context, condition.attribute);

  // Dynamic value reference: "${subject.id}" → resolve from context
  let expected = condition.value;
  if (typeof expected === 'string' && expected.startsWith('${') && expected.endsWith('}')) {
    expected = resolvePath(context, expected.slice(2, -1));
  }

  switch (condition.operator) {
    case 'eq':
      return actual === expected;
    case 'neq':
      return actual !== expected;
    case 'in':
      return Array.isArray(expected) && expected.includes(actual);
    case 'nin':
      return Array.isArray(expected) && !expected.includes(actual);
    case 'gt':
      return typeof actual === 'number' && typeof expected === 'number' && actual > expected;
    case 'gte':
      return typeof actual === 'number' && typeof expected === 'number' && actual >= expected;
    case 'lt':
      return typeof actual === 'number' && typeof expected === 'number' && actual < expected;
    case 'lte':
      return typeof actual === 'number' && typeof expected === 'number' && actual <= expected;
    case 'contains':
      return (
        typeof actual === 'string' && typeof expected === 'string' && actual.includes(expected)
      );
    case 'startsWith':
      return (
        typeof actual === 'string' && typeof expected === 'string' && actual.startsWith(expected)
      );
    case 'exists':
      return actual !== undefined && actual !== null;
    default:
      return false;
  }
}
