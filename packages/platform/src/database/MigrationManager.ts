export interface MigrationManager {
  runMigrations(): Promise<void>;
  rollback(steps?: number): Promise<void>;
}
export interface Migration {
  id: string;
  up(): Promise<void>;
  down(): Promise<void>;
}
export class InMemoryMigrationManager implements MigrationManager {
  private applied: Migration[] = [];
  constructor(private readonly migrations: readonly Migration[]) {}
  async runMigrations(): Promise<void> {
    for (const migration of this.migrations)
      if (!this.applied.some((m) => m.id === migration.id)) {
        await migration.up();
        this.applied.push(migration);
      }
  }
  async rollback(steps = 1): Promise<void> {
    for (let i = 0; i < steps && this.applied.length; i++) {
      const migration = this.applied.pop();
      if (migration) await migration.down();
    }
  }
}
