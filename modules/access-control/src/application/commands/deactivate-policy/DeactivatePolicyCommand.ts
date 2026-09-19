/** Input for {@link DeactivatePolicyHandler}. */
export interface DeactivatePolicyCommand {
  policyId: string;
  /** Actor performing the change (for audit). */
  actorId: string;
}