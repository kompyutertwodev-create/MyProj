import type { PaginatedResult, PaginationParams } from '@workspace/kernel';
import type { User } from '../User.js';
import type { Role } from '../Role.js';
import type { UserStatus } from '../UserStatus.js';

export interface UserFilters {
  search?: string;
  status?: UserStatus;
  roleFilter?: string;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(filters: UserFilters, pagination: PaginationParams): Promise<PaginatedResult<User>>;
  save(user: User): Promise<void>;
  assignRole(userId: string, role: Role): Promise<void>;
  delete(id: string): Promise<void>;
  exists(email: string): Promise<boolean>;
}
