import { apiClient } from '../http/client';
import type { TokenStorage } from './token-storage';
import { BrowserTokenStorage } from './token-storage';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  status: string;
  roles: string[];
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  user: AuthUser;
}

export class AuthSessionManager {
  constructor(private readonly storage: TokenStorage = new BrowserTokenStorage()) {}

  get(): AuthSession | null {
    return this.storage.read();
  }

  set(session: AuthSession): void {
    this.storage.write(session);
  }

  clear(): void {
    this.storage.clear();
  }

  async logout(): Promise<void> {
    const session = this.get();
    if (!session) return;

    try {
      await apiClient.post(
        '/v1/auth/logout',
        { sessionId: session.sessionId },
        {
          headers: { authorization: `Bearer ${session.accessToken}` },
        }
      );
    } finally {
      this.clear();
    }
  }
}

export const authSession = new AuthSessionManager();
