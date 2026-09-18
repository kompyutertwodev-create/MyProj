export interface Lock {
  readonly key: string;
  readonly token: string;
  readonly acquiredAt: Date;
  release(): Promise<void>;
}
