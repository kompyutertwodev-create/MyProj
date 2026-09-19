import { UniqueId } from '@workspace/kernel';

export class NotificationId extends UniqueId {
  constructor(value?: string) {
    super(value);
  }
}
