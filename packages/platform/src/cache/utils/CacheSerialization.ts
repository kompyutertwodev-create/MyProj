const DATE_TAG = '__date__';
const BIGINT_TAG = '__bigint__';
const BUFFER_TAG = '__buffer__';

export function serialize(value: unknown): string {
  return JSON.stringify(value, (_key, val) => {
    if (val instanceof Date) return { __type: DATE_TAG, value: val.toISOString() };
    if (typeof val === 'bigint') return { __type: BIGINT_TAG, value: val.toString() };
    if (val instanceof Buffer) return { __type: BUFFER_TAG, value: val.toString('base64') };
    return val as unknown;
  });
}

export function deserialize<T>(raw: string): T {
  return JSON.parse(raw, (_key, val) => {
    if (val && typeof val === 'object' && '__type' in val) {
      if (val.__type === DATE_TAG) return new Date(val.value as string);
      if (val.__type === BIGINT_TAG) return BigInt(val.value as string);
      if (val.__type === BUFFER_TAG) return Buffer.from(val.value as string, 'base64');
    }
    return val as unknown;
  }) as T;
}
