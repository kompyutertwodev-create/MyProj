export interface File {
  key: string;
  body: Uint8Array | string;
  contentType?: string;
  size?: number;
  metadata?: Record<string, string>;
  lastModified?: Date;
}
