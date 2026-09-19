import type { Notification } from '../../domain/Notification.js';
import type {
  NotificationFilter,
  NotificationRepository,
} from '../../domain/repositories/NotificationRepository.js';

export class InMemoryNotificationRepository implements NotificationRepository {
  private readonly store = new Map<string, Notification>();

  async findById(id: string): Promise<Notification | null> {
    return this.store.get(id) ?? null;
  }

  async findAll(
    filter: NotificationFilter,
    options: { limit: number; offset: number }
  ): Promise<Notification[]> {
    const filtered = this.applyFilter(filter);
    return filtered.slice(options.offset, options.offset + options.limit);
  }

  async countAll(filter: NotificationFilter): Promise<number> {
    return this.applyFilter(filter).length;
  }

  async save(notification: Notification): Promise<void> {
    this.store.set(notification.id.value, notification);
  }

  async saveMany(notifications: Notification[]): Promise<void> {
    for (const n of notifications) {
      this.store.set(n.id.value, n);
    }
  }

  clear(): void {
    this.store.clear();
  }

  private applyFilter(filter: NotificationFilter): Notification[] {
    return [...this.store.values()]
      .filter((n) => (filter.recipientId ? n.recipientId.value === filter.recipientId : true))
      .filter((n) => (filter.channel ? n.channel === filter.channel : true))
      .filter((n) => (filter.status ? n.status === filter.status : true))
      .filter((n) => (filter.from ? n.createdAt >= filter.from : true))
      .filter((n) => (filter.to ? n.createdAt <= filter.to : true))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
