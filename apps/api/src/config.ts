export interface AppConfig {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
}

export function loadConfig(): AppConfig {
  const rawPort = process.env['PORT'];

  if (!rawPort) {
    throw new Error('PORT environment variable is required but was not provided.');
  }

  const port = Number(rawPort);

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required but was not provided.');
  }

  return {
    port,
    nodeEnv: process.env['NODE_ENV'] ?? 'development',
    databaseUrl,
  };
}
