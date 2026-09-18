import type { GetUserHandler } from '../../application/queries/get-user/GetUserHandler.js';

export class UserResolver {
  constructor(private readonly getUserHandler: GetUserHandler) {}

  resolve(userId: string) {
    return this.getUserHandler.execute({ userId });
  }
}
