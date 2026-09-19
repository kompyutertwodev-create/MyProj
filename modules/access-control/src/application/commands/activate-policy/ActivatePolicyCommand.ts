/** Input for {@link ActivatePolicyHandler}. */
export interface ActivatePolicyCommand {
  policyId: string;
  /** Actor performing the change (for audit). */
  actorId: string;
}