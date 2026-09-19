import { paginate, type PaginatedResult } from '@workspace/kernel';
import type { NotificationRepository } from '../../../domain/repositories/NotificationRepository.js';
import type { ListNotificationsQuery } from './ListNotificationsQuery.js';
import type { NotificationView } from '../NotificationView.js';

export class ListNotificationsHandler {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async execute(query: ListNotificationsQuery): Promise<PaginatedResult<NotificationView>> {
    const page = Math.max(1, query.page);
    const pageSize = Math.min(100, Math.max(1, query.pageSize));
    const offset = (page - 1) * pageSize;

    const filter = {
      recipientId: query.recipientId,
      channel: query.channel,
      status: query.status,
      from: query.from,
      to: query.to,
    };

    const [items, total] = await Promise.all([
      this.notificationRepository.findAll(filter, { limit: pageSize, offset }),
      this.notificationRepository.countAll(filter),
    ]);

    const views: NotificationView[] = items.map((n) => ({
      id: n.id.value,
      recipientId: n.recipientId.value,
      channel: n.channel,
      contactValue: n.contact.value,
      status: n.status,
      subject: n.subject,
      body: n.body,
      templateKey: n.templateKey,
      metadata: n.metadata,
      errorMessage: n.errorMessage,
      sentAt: n.sentAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    }));

    return paginate(views, total, { page, pageSize });
  }
}
