export interface ConfigLoader {
  load(): Promise<Record<string, unknown>>;
}
