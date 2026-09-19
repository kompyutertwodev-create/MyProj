import { UniqueId } from '@workspace/kernel';

/**
 * Unique identifier for a RoleAssignment aggregate.
 *
 * Modeled as a dedicated Value Object (rather than a plain string) so that
 * accidental mixing with UserId/RoleId is caught by the type checker.
 */
export class RoleAssignmentId extends UniqueId {
  constructor(value?: string) {
    super(value);
  }
}