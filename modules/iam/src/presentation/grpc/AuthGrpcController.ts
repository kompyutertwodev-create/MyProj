import type { AuthService } from '../../application/services/AuthService.js';

/** Transport-neutral gRPC controller facade; bind its methods in the gRPC host. */
export class AuthGrpcController {
  constructor(readonly authService: AuthService) {}
}
