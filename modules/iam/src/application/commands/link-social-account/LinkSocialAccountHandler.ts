import type { LinkSocialAccountCommand } from './LinkSocialAccountCommand.js';
import type { OAuthProviderRegistry } from '../../strategies/OAuthProviderRegistry.js';
import type { SocialIdentityRepository } from '../../../domain/oauth/SocialIdentityRepository.js';
import { SocialIdentity } from '../../../domain/oauth/SocialIdentity.js';

export class LinkSocialAccountHandler {
  constructor(
    private readonly providerRegistry: OAuthProviderRegistry,
    private readonly socialIdentityRepo: SocialIdentityRepository
  ) {}

  async handle(command: LinkSocialAccountCommand): Promise<void> {
    const adapter = this.providerRegistry.get(command.provider);
    const profile = await adapter.exchangeCode(command.code, command.state);

    // Check if this provider account is already linked to another user
    const existing = await this.socialIdentityRepo.findByProvider(
      command.provider,
      profile.providerUserId
    );
    if (existing && existing.userId !== command.userId) {
      throw new Error(`This ${command.provider} account is already linked to another user`);
    }
    if (existing) return; // Already linked to the same user — no-op

    const socialIdentity = SocialIdentity.create(
      command.userId,
      command.provider,
      profile.providerUserId,
      profile.email,
      profile.displayName
    );
    await this.socialIdentityRepo.save(socialIdentity);
  }
}
