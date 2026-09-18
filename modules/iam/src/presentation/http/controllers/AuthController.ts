import {
  Router,
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from 'express';
import type { RegisterUserHandler } from '../../../application/commands/register-user/RegisterUserHandler.js';
import type { LoginUserHandler } from '../../../application/commands/login-user/LoginUserHandler.js';
import type { LogoutUserHandler } from '../../../application/commands/logout-user/LogoutUserHandler.js';
import type { ChangePasswordHandler } from '../../../application/commands/change-password/ChangePasswordHandler.js';
import type { AuthService } from '../../../application/services/AuthService.js';
import type { SetInitialPasswordHandler } from '../../../application/commands/set-initial-password/SetInitialPasswordHandler.js';
import { validateRequest } from '../middleware/ValidateRequest.js';
import {
  LoginRequestSchema,
  RegisterRequestSchema,
  RefreshTokenRequestSchema,
  ChangePasswordRequestSchema,
  SetPasswordRequestSchema,
  LogoutRequestSchema,
} from '../validators/index.js';

export interface AuthRouterDependencies {
  registerUser: RegisterUserHandler;
  loginUser: LoginUserHandler;
  logoutUser: LogoutUserHandler;
  changePassword: ChangePasswordHandler;
  authService: AuthService;
  authGuard: RequestHandler;
  setInitialPassword: SetInitialPasswordHandler;
}

function sendResult(
  res: Response,
  result: {
    isOk(): boolean;
    value?: unknown;
    error?: { statusCode?: number; code?: string; message: string };
  }
): void {
  if (!result.isOk()) {
    const error = result.error;
    res.status(error?.statusCode ?? 500).json({
      success: false,
      error: { code: error?.code ?? 'INTERNAL_ERROR', message: error?.message ?? 'Request failed' },
    });
    return;
  }
  res.status(200).json({ success: true, data: result.value });
}

/** Core email/password authentication routes. */
export function createAuthRouter(deps: AuthRouterDependencies): Router {
  const router = Router();

  router.post('/register', validateRequest(RegisterRequestSchema), async (req, res, next) => {
    try {
      const body = req.validated?.body;
      sendResult(res, await deps.registerUser.execute(body));
    } catch (error) {
      next(error);
    }
  });

  router.post('/login', validateRequest(LoginRequestSchema), async (req, res, next) => {
    try {
      const body = req.validated?.body;
      sendResult(res, await deps.loginUser.execute(body));
    } catch (error) {
      next(error);
    }
  });

  router.post('/refresh', validateRequest(RefreshTokenRequestSchema), async (req, res, next) => {
    try {
      const { refreshToken } = req.validated?.body;
      sendResult(res, await deps.authService.refreshToken(refreshToken));
    } catch (error) {
      next(error);
    }
  });

  router.post(
    '/logout',
    deps.authGuard,
    validateRequest(LogoutRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
          });
          return;
        }
        const { sessionId } = req.validated?.body;
        sendResult(res, await deps.logoutUser.execute({ sessionId, userId: req.user.userId }));
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/change-password',
    deps.authGuard,
    validateRequest(ChangePasswordRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
          });
          return;
        }
        const { currentPassword, newPassword } = req.validated?.body;
        sendResult(
          res,
          await deps.changePassword.execute({
            userId: req.user.userId,
            currentPassword,
            newPassword,
          })
        );
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/set-password',
    deps.authGuard,
    validateRequest(SetPasswordRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          res.status(401).json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
          });
          return;
        }
        const { newPassword } = req.validated?.body;
        sendResult(
          res,
          await deps.setInitialPassword.execute({
            userId: req.user.userId,
            newPassword,
          })
        );
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
