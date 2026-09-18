import {
  createLogger,
  type Logger,
  createPostgresDatabase,
  type PostgresDatabase,
} from '@workspace/platform';
import {
  createIamContainer,
  createIamRouterFromContainer,
  createTenantContainer,
  createTenantRouterFromContainer,
  createAuditContainer,
  createAuditRouterFromContainer,
  type IamContainerOptions,
} from './container/index.js';
import { createAuthGuard } from '@workspace/iam';

export interface AppContainer {
  logger: Logger;
  database: PostgresDatabase;
  iamRouter: ReturnType<typeof createIamRouterFromContainer>;
  iamContainer: Awaited<ReturnType<typeof createIamContainer>>;
  tenantRouter: ReturnType<typeof createTenantRouterFromContainer>;
  tenantContainer: ReturnType<typeof createTenantContainer>;
  auditRouter: ReturnType<typeof createAuditRouterFromContainer>;
  auditContainer: ReturnType<typeof createAuditContainer>;
}

export interface ContainerOptions extends Omit<IamContainerOptions, 'database'> {
  databaseUrl: string;
}

export async function createContainer(options: ContainerOptions): Promise<AppContainer> {
  const logger = createLogger('api');
  const database = createPostgresDatabase(options.databaseUrl);

  const iamContainer = await createIamContainer({
    ...options,
    database,
  });
  const iamRouter = createIamRouterFromContainer(iamContainer);

  const tenantContainer = await createTenantContainer({
    database,
    events: iamContainer.events,
  });
  const tenantRouter = createTenantRouterFromContainer(
    tenantContainer,
    createAuthGuard(iamContainer.tokenService)
  );

  const auditContainer = createAuditContainer({
    database,
    eventBus: iamContainer.events,
  });
  const auditRouter = createAuditRouterFromContainer(
    auditContainer,
    createAuthGuard(iamContainer.tokenService)
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
  };
}
