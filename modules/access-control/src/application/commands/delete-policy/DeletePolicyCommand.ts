/** Input for {@link DeletePolicyHandler}. */
export interface DeletePolicyCommand {
  policyId: string;
  /** Actor performing the change (for audit). */
  deletedBy: string;
}