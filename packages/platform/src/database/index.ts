export type { Connection } from './Connection.js';
export { MemoryConnection } from './Connection.js';

export type { Transaction } from './Transaction.js';

export type { TransactionManager } from './TransactionManager.js';
export { MemoryTransactionManager } from './TransactionManager.js';

export type { MigrationManager, Migration } from './MigrationManager.js';
export { InMemoryMigrationManager } from './MigrationManager.js';

export type { SqlQuery } from './QueryBuilder.js';
export { sql } from './QueryBuilder.js';

export { DrizzleTransaction } from './drizzle/DrizzleTransaction.js';
export type { TransactionalDatabase } from './drizzle/DrizzleTransaction.js';

export { createPostgresDatabase, checkPostgresDatabaseHealth } from './drizzle/PostgresDatabase.js';

export type { PostgresDatabase, DatabaseHealthResult } from './drizzle/PostgresDatabase.js';
