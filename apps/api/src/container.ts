import {
  createLogger,
  type Logger,
  createPostgresDatabase,
  type PostgresDatabase,
  SendgridEmailService,
} from '@workspace/platform';
import { PlatformEmailSender } from '@workspace/notification';
import { createAuthGuard } from '@workspace/iam';
import {
  createIamContainer,
  createIamRouterFromContainer,
  createTenantContainer,
  createTenantRouterFromContainer,
  createAuditContainer,
  createAuditRouterFromContainer,
  createNotificationContainer,
  createNotificationRouterFromContainer,
  createAccessControlContainer,
  createAccessControlRouterFromContainer,
  type IamContainerOptions,
} from './container/index.js';
import { ApiContactResolver } from './container/contact-resolver.js';
import { AccessControlAuthorizationAdapter } from '@workspace/access-control';

export interface AppContainer {
  logger: Logger;
  database: PostgresDatabase;
  iamRouter: ReturnType<typeof createIamRouterFromContainer>;
  iamContainer: Awaited<ReturnType<typeof createIamContainer>>;
  tenantRouter: ReturnType<typeof createTenantRouterFromContainer>;
  tenantContainer: Awaited<ReturnType<typeof createTenantContainer>>;
  auditRouter: ReturnType<typeof createAuditRouterFromContainer>;
  auditContainer: ReturnType<typeof createAuditContainer>;
  notificationRouter: ReturnType<typeof createNotificationRouterFromContainer>;
  notificationContainer: ReturnType<typeof createNotificationContainer>;
  accessControlRouter: ReturnType<typeof createAccessControlRouterFromContainer>;
  accessControlContainer: Awaited<ReturnType<typeof createAccessControlContainer>>;
}

export interface ContainerOptions extends Omit<IamContainerOptions, 'database' | 'authorization'> {
  databaseUrl: string;
  sendgridApiKey?: string;
  emailFrom?: string;
  telegramBotToken?: string;
}

/**
 * Composition root.
 *
 * Order matters: access-control is created first so its authorization
 * adapter can be injected into the IAM container before IAM handlers are
 * constructed. This is the only place that knows about both modules вЂ”
 * neither imports the other directly.
 */
export async function createContainer(options: ContainerOptions): Promise<AppContainer> {
  const logger = createLogger('api');
  const database = createPostgresDatabase(options.databaseUrl);

  // 1. Access-control first вЂ” it owns RBAC + ABAC.
  const accessControlContainer = await createAccessControlContainer({ database });
  const accessControlRouter = createAccessControlRouterFromContainer(
    accessControlContainer,
    // The auth guard is created after the iam container below, so we
    // declare the route builder here but wire the guard lazily.
    async (_req, _res, next) => { next(); },
  );

  // 2. AuthorizationPort adapter вЂ” iam's view of access-control.
  const authorization = new AccessControlAuthorizationAdapter(
    accessControlContainer.checkPermission,
    accessControlContainer.listUserRoles,
  );

  // 3. IAM вЂ” auth + users + oauth, with the adapter injected.
  const iamContainer = await createIamContainer({
    ...options,
    database,
    authorization,
  });
  const iamRouter = createIamRouterFromContainer(iamContainer);

  // 4. Re-mount access-control with the real auth guard now that iam
  //    has issued its token service.
  const accessControlRouterWithGuard = createAccessControlRouterFromContainer(
    accessControlContainer,
    createAuthGuard(iamContainer.tokenService),
  );

  const tenantContainer = await createTenantContainer({
    database,
    transport: iamContainer.transport,
  });
  const tenantRouter = createTenantRouterFromContainer(
    tenantContainer,
    createAuthGuard(iamContainer.tokenService),
  );

  const auditContainer = createAuditContainer({
    database,
    eventBus: iamContainer.events,
  });
  const auditRouter = createAuditRouterFromContainer(
    auditContainer,
    createAuthGuard(iamContainer.tokenService),
  );

  // Optional email sender
  let emailSender: PlatformEmailSender | undefined;
  if (options.sendgridApiKey && options.emailFrom) {
    const sendgridClient = {
      async send(data: Record<string, unknown>): Promise<unknown> {
        const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${options.sendgridApiKey}`,
          },
          body: JSON.stringify({
            personalizations: [{ to: (data['to'] as string[] | string) }],
            from: { email: data['from'] },
            subject: data['subject'],
            content: [
              { type: 'text/plain', value: data['text'] ?? '' },
              { type: 'text/html', value: data['html'] ?? data['text'] ?? '' },
            ],
          }),
        });
        if (!res.ok) {
          throw new Error(`SendGrid responded ${res.status}`);
        }
        return { id: `sendgrid-${Date.now()}` };
      },
    };
    const emailService = new SendgridEmailService(sendgridClient, options.emailFrom);
    emailSender = new PlatformEmailSender({ emailService, from: options.emailFrom });
  }

  const contactResolver = new ApiContactResolver(iamContainer.getUser);

  const notificationContainer = createNotificationContainer({
    database,
    eventBus: iamContainer.events,
    contactResolver,
    emailSender,
    telegramBotToken: options.telegramBotToken,
  });
  const notificationRouter = createNotificationRouterFromContainer(
    notificationContainer,
    createAuthGuard(iamContainer.tokenService),
  );

  return {
    logger,
    database,
    iamRouter,
    iamContainer,
    tenantRouter,
    tenantContainer,
    auditRouter,
    auditContainer,
    notificationRouter,
    notificationContainer,
    accessControlRouter: accessControlRouterWithGuard,
    accessControlContainer,
  };
}