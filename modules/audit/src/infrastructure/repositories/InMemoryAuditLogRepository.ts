import type { AuditLog } from '../../domain/AuditLog.js';
import type {
  AuditLogFilter,
  AuditLogRepository,
} from '../../domain/repositories/AuditLogRepository.js';

export class InMemoryAuditLogRepository implements AuditLogRepository {
  private readonly store = new Map<string, AuditLog>();

  async findById(id: string): Promise<AuditLog | null> {
    return this.store.get(id) ?? null;
  }

  async findAll(
    filter: AuditLogFilter,
    options: { limit: number; offset: number }
  ): Promise<AuditLog[]> {
    const filtered = this.applyFilter(filter);
    return filtered.slice(options.offset, options.offset + options.limit);
  }

  async countAll(filter: AuditLogFilter): Promise<number> {
    return this.applyFilter(filter).length;
  }

  async save(log: AuditLog): Promise<void> {
    this.store.set(log.id.value, log);
  }

  async saveMany(logs: AuditLog[]): Promise<void> {
    for (const log of logs) {
      this.store.set(log.id.value, log);
    }
  }

  clear(): void {
    this.store.clear();
  }

  private applyFilter(filter: AuditLogFilter): AuditLog[] {
    return [...this.store.values()]
      .filter((log) => (filter.actorId ? log.actorId.value === filter.actorId : true))
      .filter((log) => (filter.tenantId ? log.tenantRef.value === filter.tenantId : true))
      .filter((log) => (filter.eventType ? log.eventType === filter.eventType : true))
      .filter((log) => (filter.targetType ? log.targetType === filter.targetType : true))
      .filter((log) => (filter.targetId ? log.targetId === filter.targetId : true))
      .filter((log) => (filter.from ? log.occurredAt >= filter.from : true))
      .filter((log) => (filter.to ? log.occurredAt <= filter.to : true))
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
  }
}
