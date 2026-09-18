import type { AuthSession } from './session';

export interface TokenStorage {
  read(): AuthSession | null;
  write(session: AuthSession): void;
  clear(): void;
}

const STORAGE_KEY = 'identity-platform.auth-session';

interface BrowserStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function getBrowserStorage(): BrowserStorage | null {
  const runtime = globalThis as typeof globalThis & { localStorage?: BrowserStorage };
  return runtime.localStorage ?? null;
}

export class BrowserTokenStorage implements TokenStorage {
  read(): AuthSession | null {
    const storage = getBrowserStorage();
    if (!storage) return null;
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      this.clear();
      return null;
    }
  }

  write(session: AuthSession): void {
    getBrowserStorage()?.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  clear(): void {
    getBrowserStorage()?.removeItem(STORAGE_KEY);
  }
}
