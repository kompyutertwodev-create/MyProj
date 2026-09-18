import type { JsonValue } from '../types/JsonValue.js';

export function isJsonValue(value: unknown): value is JsonValue {
  if (value === null) return true;
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean') return true;
  if (Array.isArray(value)) return value.every(isJsonValue);
  if (t === 'object' && value !== null) {
    return Object.values(value as Record<string, unknown>).every(isJsonValue);
  }
  return false;
}
