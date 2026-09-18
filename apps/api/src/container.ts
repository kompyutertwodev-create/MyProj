import {
  createLogger,
  type Logger,
  createPostgresDatabase,
  type PostgresDatabase,
} from '@workspace/platform';
import {
  createIamContainer,
  createIamRouterFromContainer,
  type IamContainerOptions,
} from './container/index.js';

export interface AppContainer {
  logger: Logger;
  database: PostgresDatabase;
  iamRouter: ReturnType<typeof createIamRouterFromContainer>;
  iamContainer: Awaited<ReturnType<typeof createIamContainer>>;
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

  return { logger, database, iamRouter, iamContainer };
}
