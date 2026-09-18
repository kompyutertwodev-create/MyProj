import {
  Router,
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from 'express';
import type { OAuthProviderRegistry } from '../../../application/strategies/OAuthProviderRegistry.js';
import { OAuthLoginHandler } from '../../../application/commands/oauth-login/OAuthLoginHandler.js';
import { LinkSocialAccountHandler } from '../../../application/commands/link-social-account/LinkSocialAccountHandler.js';
import type { InitiateOAuthHandler } from '../../../application/commands/oauth-initiate/InitiateOAuthHandler.js';
import type { OAuthProvider } from '../../../domain/oauth/OAuthProvider.js';
import type { OAuthStateRepository } from '../../../domain/oauth/OAuthStateRepository.js';
import {
  OAuthAuthenticationError,
  OAuthProviderError,
} from '../../../application/ports/OAuthErrors.js';
import {
  OAuthProviderSchema,
  OAuthCallbackRequestSchema,
  LinkAccountRequestSchema,
  TelegramAuthRequestSchema,
} from '../validators/index.js';

interface AuthenticatedRequest extends Request {
  user?: { userId: string; roles: string[] };
}

interface OAuthControllerDependencies {
  initiateOAuth: InitiateOAuthHandler;
  oauthLogin: OAuthLoginHandler;
  linkSocialAccount: LinkSocialAccountHandler;
  providerRegistry: OAuthProviderRegistry;
  stateRepository: OAuthStateRepository;
  authGuard?: RequestHandler;
}

/**
 * OAuth / Social-login HTTP routes.
 *
 * GET  /auth/oauth/:provider           → redirect to provider
 * GET  /auth/oauth/:provider/callback  → handle callback, issue tokens
 * POST /auth/oauth/:provider/link      → link provider to existing account (authenticated)
 * DELETE /auth/oauth/:provider/unlink  → unlink a social account (authenticated)
 */
export function createOAuthRouter(deps: OAuthControllerDependencies): Router {
  const router = Router();
  const authGuard = deps.authGuard ?? requireAuthenticated;

  /** GET /auth/oauth/:provider — initiate OAuth flow */
  router.get('/:provider', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const provider = OAuthProviderSchema.parse(req.params['provider']) as OAuthProvider;
      const result = await deps.initiateOAuth.execute({ provider });

      if (!result.isOk()) {
        const error = result.error;
        res.status(error.statusCode ?? 500).json({
          success: false,
          error: { code: error.code ?? 'OAUTH_ERROR', message: error.message },
        });
        return;
      }

      // Set state cookie for callback verification
      res.cookie('oauth_state', result.value.state, {
        httpOnly: true,
        secure: process.env['NODE_ENV'] === 'production',
        maxAge: 10 * 60 * 1000,
        sameSite: 'lax',
      });

      res.redirect(result.value.authorizationUrl);
    } catch (err) {
      next(err);
    }
  });

  /** GET /auth/oauth/:provider/callback — provider redirects here with code */
  router.get('/:provider/callback', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const provider = OAuthProviderSchema.parse(req.params['provider']) as OAuthProvider;
      const { code, state, error } = OAuthCallbackRequestSchema.parse(req.query);

      if (error) {
        res.status(400).json({
          success: false,
          error: { code: 'OAUTH_ERROR', message: `OAuth provider returned error: ${error}` },
        });
        return;
      }

      // Verify CSRF state (skip for Telegram which uses a different flow).
      const savedState = req.cookies?.['oauth_state'] as string | undefined;
      if (provider !== 'telegram') {
        const stateMatchesCookie = Boolean(state && savedState && state === savedState);
        const stateWasConsumed = stateMatchesCookie
          ? await deps.stateRepository.consume(state!, provider)
          : false;
        if (!stateWasConsumed) {
          res.status(400).json({
            success: false,
            error: { code: 'OAUTH_STATE_INVALID', message: 'Invalid or expired OAuth state' },
          });
          return;
        }
        res.clearCookie('oauth_state');
      }

      if (!code) {
        res.status(400).json({
          success: false,
          error: { code: 'OAUTH_CODE_MISSING', message: 'Missing authorization code' },
        });
        return;
      }

      const result = await deps.oauthLogin.handle({
        provider,
        code,
        state,
        deviceInfo: {
          ipAddress: req.ip ?? 'unknown',
          userAgent: req.headers['user-agent'] ?? 'unknown',
        },
      });

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      if (sendOAuthError(res, err)) return;
      next(err);
    }
  });

  /**
   * POST /auth/oauth/:provider/link — link provider to currently authenticated user.
   * Requires Bearer token in Authorization header.
   */
  router.post(
    '/:provider/link',
    authGuard,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.userId;
        if (!userId) {
          res.status(401).json({ error: 'Authentication required' });
          return;
        }

        const provider = OAuthProviderSchema.parse(req.params['provider']) as OAuthProvider;
        const { code, state } = LinkAccountRequestSchema.parse(req.body);

        await deps.linkSocialAccount.handle({ userId, provider, code, state });
        res.status(200).json({ success: true, message: `${provider} account linked` });
      } catch (err) {
        if (sendOAuthError(res, err)) return;
        next(err);
      }
    }
  );

  /**
   * POST /auth/oauth/telegram — Telegram Login Widget callback.
   * The frontend POSTs the Telegram auth data directly (not a redirect).
   */
  router.post('/telegram', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = TelegramAuthRequestSchema.parse(req.body);
      const code = JSON.stringify(body); // TelegramOAuthProvider parses this

      const result = await deps.oauthLogin.handle({
        provider: 'telegram' as OAuthProvider,
        code,
        deviceInfo: {
          ipAddress: req.ip ?? 'unknown',
          userAgent: req.headers['user-agent'] ?? 'unknown',
        },
      });

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      if (sendOAuthError(res, err)) return;
      next(err);
    }
  });

  return router;
}

function requireAuthenticated(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
    return;
  }
  next();
}

function sendOAuthError(res: Response, error: unknown): boolean {
  if (!(error instanceof OAuthProviderError) && !(error instanceof OAuthAuthenticationError)) {
    return false;
  }

  res.status(error.statusCode).json({
    success: false,
    error: { code: error.code, message: error.message },
  });
  return true;
}
