import {
  Router,
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from 'express';
import type { SendNotificationHandler } from '../../../application/commands/send-notification/SendNotificationHandler.js';
import type { ListNotificationsHandler } from '../../../application/queries/list-notifications/ListNotificationsHandler.js';
import type { NotificationChannel } from '../../../domain/NotificationChannel.js';
import type { NotificationStatus } from '../../../domain/NotificationStatus.js';
import { validateRequest } from '../middleware/ValidateRequest.js';
import {
  ListNotificationsRequestSchema,
  SendNotificationRequestSchema,
} from '../validators/index.js';

export interface NotificationRouterDependencies {
  sendNotification: SendNotificationHandler;
  listNotifications: ListNotificationsHandler;
  authGuard: RequestHandler;
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
      error: {
        code: error?.code ?? 'INTERNAL_ERROR',
        message: error?.message ?? 'Request failed',
      },
    });
    return;
  }
  res.status(200).json({ success: true, data: result.value });
}

export function createNotificationRouter(deps: NotificationRouterDependencies): Router {
  const router = Router();

  // POST / — send a notification (admin/ops usage)
  router.post(
    '/',
    deps.authGuard,
    validateRequest(SendNotificationRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const body = req.validated?.body as {
          recipientId: string;
          channel: NotificationChannel;
          contact: string;
          subject: string;
          body: string;
          templateKey?: string | null;
          metadata?: Record<string, unknown>;
        };
        sendResult(res, await deps.sendNotification.execute(body));
      } catch (error) {
        next(error);
      }
    }
  );

  // GET / — list notifications with filters and pagination
  router.get(
    '/',
    deps.authGuard,
    validateRequest(ListNotificationsRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const query = req.validated?.query as {
          page: number;
          pageSize: number;
          recipientId?: string;
          channel?: NotificationChannel;
          status?: NotificationStatus;
          from?: Date;
          to?: Date;
        };
        const result = await deps.listNotifications.execute({
          page: query.page,
          pageSize: query.pageSize,
          recipientId: query.recipientId,
          channel: query.channel,
          status: query.status,
          from: query.from,
          to: query.to,
        });
        res.status(200).json({ success: true, data: result });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
