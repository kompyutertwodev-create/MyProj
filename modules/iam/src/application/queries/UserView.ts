import type { UserStatus } from '../../domain/UserStatus.js';

/**
 * Read model for a User.
 *
 * Deliberately excludes roles and permissions: those belong to the
 * access-control module and are queried via the AuthorizationPort, not
 * loaded as part of the user projection.
 */
export interface UserView {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  status: UserStatus;
  tenantId: string | null;
  createdAt: string;
  updatedAt: string;
}