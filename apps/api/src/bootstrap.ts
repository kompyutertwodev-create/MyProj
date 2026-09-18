import { loadConfig, type AppConfig } from './config';
import { createContainer, type AppContainer } from './container';
import { createServer } from './server';
import type { Express } from 'express';

export interface Bootstrapped {
  app: Express;
  config: AppConfig;
  container: AppContainer;
}

export async function bootstrap(): Promise<Bootstrapped> {
  const config = loadConfig();
  const container = await createContainer({ databaseUrl: config.databaseUrl });
  const app = createServer(container);
  return { app, config, container };
}
