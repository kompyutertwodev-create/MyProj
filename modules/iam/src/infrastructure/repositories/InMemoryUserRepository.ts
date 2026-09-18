import type { PaginatedResult, PaginationParams } from '@workspace/kernel';
import type { UserRepository, UserFilters } from '../../domain/repositories/UserRepository.js';
import type { User } from '../../domain/User.js';
import type { Role } from '../../domain/Role.js';

export class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, User>();

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    return [...this.users.values()].find((u) => u.email.value === normalized) ?? null;
  }

  async findAll(
    filters: UserFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<User>> {
    let values = [...this.users.values()];
    if (filters.search) {
      const search = filters.search.toLowerCase();
      values = values.filter(
        (u) => u.email.value.includes(search) || u.displayName.toLowerCase().includes(search)
      );
    }
    if (filters.status) values = values.filter((u) => u.status === filters.status);
    if (filters.roleFilter) values = values.filter((u) => u.hasRole(filters.roleFilter!));

    const total = values.length;
    const start = Math.max(0, (pagination.page - 1) * pagination.pageSize);
    return {
      items: values.slice(start, start + pagination.pageSize),
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: Math.ceil(total / pagination.pageSize),
      hasNextPage: start + pagination.pageSize < total,
      hasPreviousPage: pagination.page > 1,
    };
  }

  async save(user: User): Promise<void> {
    this.users.set(user.id.value, user);
  }

  async assignRole(userId: string, role: Role): Promise<void> {
    const user = this.users.get(userId);
    if (user && !user.hasRole(role.name.value)) {
      user.assignRole(role);
    }
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id);
  }

  async exists(email: string): Promise<boolean> {
    return (await this.findByEmail(email)) !== null;
  }
}
