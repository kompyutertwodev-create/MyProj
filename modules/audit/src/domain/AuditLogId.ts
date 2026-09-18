import { UniqueId } from '@workspace/kernel';

export class AuditLogId extends UniqueId {
  constructor(value?: string) {
    super(value);
  }
}
