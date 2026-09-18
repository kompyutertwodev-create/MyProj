import { User, Email, PasswordHash, UserStatus } from '../../domain/index.js';
import type { UserReconstructProps } from '../../domain/User.js';
import type { Role } from '../../domain/Role.js';

export interface UserPersistence {
  id: string;
  email: string;
  passwordHash: string;
  passwordSet: boolean;
  displayName: string;
  avatarUrl: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserMapper {
  static toDomain(row: UserPersistence, roles: Role[] = []): User {
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
      roles,
      sessions: [],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
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
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
