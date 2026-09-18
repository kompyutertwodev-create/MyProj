import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { PostgresDatabase } from './PostgresDatabase.js';

/**
 * Executes SQL migration files from a directory in order.
 * Migrations are expected to be named with numeric prefixes (e.g., 0001_initial.sql).
 */
export async function runSqlMigrations(
  database: PostgresDatabase,
  migrationsDir: string
): Promise<void> {
  const migrationFiles = readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    const filePath = join(migrationsDir, file);
    let sql = readFileSync(filePath, 'utf-8');
    
    // Remove BOM (Byte Order Mark) if present
    if (sql.charCodeAt(0) === 0xFEFF) {
      sql = sql.slice(1);
    }
    
    // Skip empty migration files
    if (!sql.trim()) {
      console.log(`Skipped empty migration: ${file}`);
      continue;
    }
    
    try {
      await database.pool.query(sql);
      console.log(`Executed migration: ${file}`);
    } catch (error) {
      console.error(`Failed to execute migration ${file}:`, error);
      throw error;
    }
  }
}
