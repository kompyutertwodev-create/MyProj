import { UniqueId } from '@workspace/kernel';

/**
 * Unique identifier for a {@link Role} aggregate.
 *
 * Extends the kernel {@link UniqueId} so every RoleId gets a v4 UUID by
 * default while still allowing re-hydration from persistence.
 */
export class RoleId extends UniqueId {
  constructor(value?: string) {
    super(value);
  }
}