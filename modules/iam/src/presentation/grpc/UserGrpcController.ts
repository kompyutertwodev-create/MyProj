import type { GetUserHandler } from '../../application/queries/get-user/GetUserHandler.js';

/** Transport-neutral gRPC controller facade; bind its methods in the gRPC host. */
export class UserGrpcController {
  constructor(readonly getUserHandler: GetUserHandler) {}

  getUser(userId: string) {
    return this.getUserHandler.execute({ userId });
  }
}
