export interface Config {
  get<T>(key: string): T;
  getOrDefault<T>(key: string, defaultValue: T): T;
}
