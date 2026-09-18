export function getEnv(key: string, fallback?: string): string {
  return process.env[key] ?? fallback ?? '';
}

export function requireEnv(key: string): string {
  const value = process.env[key];
  if (value === undefined || value === '') {
    throw new Error(`Required environment variable "${key}" is not set`);
  }
  return value;
}
