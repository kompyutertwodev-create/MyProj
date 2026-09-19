import { UniqueId } from '@workspace/kernel';

/**
 * Unique identifier for a Policy aggregate.
 */
export class PolicyId extends UniqueId {
  constructor(value?: string) {
    super(value);
  }
}