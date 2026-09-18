import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

const { Pool } = pg;

export interface DatabaseHealthResult {
  healthy: boolean;
  latency: number;
  error?: string;
}

export interface PostgresDatabase {
  db: ReturnType<typeof drizzle>;
  pool: InstanceType<typeof Pool>;
  close(): Promise<void>;
}

/**
 * Creates the application's PostgreSQL/Drizzle connection.
 * The host owns the lifecycle; platform owns the technical implementation.
 */
export function createPostgresDatabase(connectionString: string): PostgresDatabase {
  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  return {
    db,
    pool,
    close: () => pool.end(),
  };
}

/** Platform-owned PostgreSQL health probe. */
export async function checkPostgresDatabaseHealth(
  database: PostgresDatabase
): Promise<DatabaseHealthResult> {
  const start = Date.now();

  try {
    await database.pool.query('SELECT 1');

    return {
      healthy: true,
      latency: Date.now() - start,
    };
  } catch (err: unknown) {
    return {
      healthy: false,
      latency: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
