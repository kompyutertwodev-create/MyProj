import { User, Email, PasswordHash, UserStatus } from '../../domain/index.js';
import type { UserReconstructProps } from '../../domain/User.js';

/**
 * Persistence representation of a User.
 *
 * Sessions are not part of the User row: they live in their own table and
 * are loaded separately. This keeps the mapper a pure 1:1 projection.
 */
export interface UserPersistence {
  id: string;
  email: string;
  passwordHash: string;
  passwordSet: boolean;
  displayName: string;
  avatarUrl: string | null;
  status: string;
  tenantId: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

/**
 * UserMapper вЂ” converts between the User aggregate and its persistence row.
 *
 * `toDomain` takes an optional `sessions` array so callers that already
 * have the related rows can pass them in without a second query.
 */
export class UserMapper {
  static toDomain(row: UserPersistence, sessions: UserReconstructProps['sessions'] = []): User {
    const email = Email.create(row.email);
    if (email.isErr()) throw email.error;

    const props: UserReconstructProps = {
      id: row.id,
      email: email.value,
      passwordHash: PasswordHash.create(row.passwordHash),
      passwordSet: row.passwordSet,
      displayName: row.displayName,
      avatarUrl: row.avatarUrl,
      status: row.status as UserStatus,
      tenantId: row.tenantId,
      deletedAt: row.deletedAt,
      sessions,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      version: row.version,
    };
    return User.reconstruct(props);
  }

  static toPersistence(user: User): UserPersistence {
    return {
      id: user.id.value,
      email: user.email.value,
      passwordHash: user.passwordHash.value,
      passwordSet: user.passwordSet,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      status: user.status,
      tenantId: user.tenantId,
      deletedAt: user.deletedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      version: user.version,
    };
  }
}