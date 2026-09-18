import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Storage } from '../Storage.js';
import type { File } from '../File.js';
import type { StorageOptions } from '../StorageOptions.js';
import type { S3PresignedUrl } from './S3PresignedUrl.js';
export interface S3StorageOptions {
  bucket: string;
  client?: S3Client;
  region?: string;
  endpoint?: string;
}
export class S3Storage implements Storage {
  private readonly client: S3Client;
  constructor(private readonly options: S3StorageOptions) {
    this.client =
      options.client ??
      new S3Client({
        region: options.region ?? process.env['AWS_REGION'],
        endpoint: options.endpoint,
      });
  }
  async put(key: string, body: Uint8Array | string, options?: StorageOptions): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.options.bucket,
        Key: key,
        Body: body,
        ContentType: options?.contentType,
        Metadata: options?.metadata,
        CacheControl: options?.cacheControl,
      })
    );
  }
  async get(key: string): Promise<File | null> {
    try {
      const r = await this.client.send(
        new GetObjectCommand({ Bucket: this.options.bucket, Key: key })
      );
      const body = r.Body ? new Uint8Array(await r.Body.transformToByteArray()) : new Uint8Array();
      return {
        key,
        body,
        contentType: r.ContentType,
        size: r.ContentLength,
        metadata: r.Metadata,
        lastModified: r.LastModified,
      };
    } catch (e) {
      if ((e as { name?: string }).name === 'NoSuchKey') return null;
      throw e;
    }
  }
  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.options.bucket, Key: key }));
  }
  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.options.bucket, Key: key }));
      return true;
    } catch (e) {
      if ((e as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404)
        return false;
      throw e;
    }
  }
  async list(prefix = ''): Promise<string[]> {
    const r = await this.client.send(
      new ListObjectsV2Command({ Bucket: this.options.bucket, Prefix: prefix })
    );
    return (r.Contents ?? []).flatMap((x) => (x.Key ? [x.Key] : []));
  }
  async presignedUrl(key: string, expiresInSeconds = 3600): Promise<S3PresignedUrl> {
    return {
      url: await getSignedUrl(
        this.client,
        new GetObjectCommand({ Bucket: this.options.bucket, Key: key }),
        { expiresIn: expiresInSeconds }
      ),
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
    };
  }
  async getUrl(key: string, expires = 3600): Promise<string> {
    return (await this.presignedUrl(key, expires)).url;
  }
}
