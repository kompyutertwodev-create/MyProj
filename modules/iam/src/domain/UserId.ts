import { UniqueId } from '@workspace/kernel';

export class UserId extends UniqueId {
  constructor(value?: string) {
    super(value);
  }
}
