/**
 * ABAC policy evaluation result.
 *
 * A matching policy always resolves to either Allow or Deny.
 * The absence of a matching policy is represented as `null`, not as an effect.
 */
export enum PolicyEffect {
  Allow = 'allow',
  Deny = 'deny',
}