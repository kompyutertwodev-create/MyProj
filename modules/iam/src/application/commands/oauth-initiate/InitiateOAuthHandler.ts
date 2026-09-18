import { randomUUID } from 'node:crypto';
import type { Result } from '@workspace/kernel';
import { err, ok } from '@workspace/kernel';
import type { OAuthProviderRegistry } from '../../strategies/OAuthProviderRegistry.js';
import type { OAuthStateRepository } from '../../../domain/oauth/OAuthStateRepository.js';
import type { OAuthProvider } from '../../../domain/oauth/OAuthProvider.js';
import type { InitiateOAuthCommand, InitiateOAuthResult } from './InitiateOAuthCommand.js';
import type { ApplicationError } from '../../ports/ApplicationError.js';
import {
  NotFoundApplicationError,
  InternalApplicationError,
} from '../../ports/ApplicationError.js';

export class InitiateOAuthHandler {
  constructor(
    private readonly providerRegistry: OAuthProviderRegistry,
    private readonly stateRepository: OAuthStateRepository
  ) {}

  async execute(
    command: InitiateOAuthCommand
  ): Promise<Result<InitiateOAuthResult, ApplicationError>> {
    try {
      // Cast provider to domain type
      const provider = command.provider as OAuthProvider;

      // Validate provider exists
      if (!this.providerRegistry.has(provider)) {
        return err(
          new NotFoundApplicationError(`OAuth provider '${command.provider}' is not configured`)
        );
      }

      // Generate state
      const state = randomUUID();

      // Save state (skip for Telegram)
      if (provider !== 'telegram') {
        await this.stateRepository.save(
          state,
          provider,
          new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry
        );
      }

      // Get authorization URL
      const adapter = this.providerRegistry.get(provider);
      const authorizationUrl = adapter.getAuthorizationUrl(state);

      return ok({
        authorizationUrl,
        state,
        provider: command.provider,
      });
    } catch (error) {
      return err(
        new InternalApplicationError(
          error instanceof Error ? error.message : 'Failed to initiate OAuth flow'
        )
      );
    }
  }
}
