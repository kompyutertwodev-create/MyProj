import { UniqueId } from '@workspace/kernel';

export class TenantId extends UniqueId {
  constructor(value?: string) {
    super(value);
  }
}
