import type { AuthService } from '../../application/services/AuthService.js';

/**
 * GraphQL adapter contract. GraphQL decorators/resolvers are intentionally not
 * coupled into IAM because the host app may use a different GraphQL library.
 */
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  get service(): AuthService {
    return this.authService;
  }
}
