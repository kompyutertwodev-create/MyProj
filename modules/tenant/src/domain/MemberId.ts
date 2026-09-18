import { UniqueId } from '@workspace/kernel';

export class MemberId extends UniqueId {
  constructor(value?: string) {
    super(value);
  }
}
