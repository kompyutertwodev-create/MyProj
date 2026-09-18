import { UniqueId } from '@workspace/kernel';

export class RoleId extends UniqueId {
  constructor(value?: string) {
    super(value);
  }
}
