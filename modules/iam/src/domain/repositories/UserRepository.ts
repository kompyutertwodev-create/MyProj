import type { PaginatedResult, PaginationParams } from '@workspace/kernel';
import type { User } from '../User.js';
import type { UserStatus } from '../UserStatus.js';

export interface UserFilters {
  search?: string;
  status?: UserStatus;
  tenantId?: string;
  includeDeleted?: boolean;
}

/**
 * Repository contract for the User aggregate.
 *
 * Deliberately unaware of roles / permissions / policies вЂ” those live in
 * @workspace/access-control and are reached via the AuthorizationPort.
 */
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(
    filters: UserFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<User>>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
  exists(email: string): Promise<boolean>;
}