import { UniqueId } from '@workspace/kernel';

export class SessionId extends UniqueId {
  constructor(value?: string) {
    super(value);
  }
}
