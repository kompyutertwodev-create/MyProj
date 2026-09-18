import { mkdir, readFile, writeFile, unlink, readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { Storage } from '../Storage.js';
import type { File } from '../File.js';
import type { StorageOptions } from '../StorageOptions.js';

export class LocalStorage implements Storage {
  constructor(private readonly directory = '.storage') {}
  private path(key: string): string {
    const root = resolve(this.directory),
      path = resolve(root, key);
    if (path !== root && !path.startsWith(root + '/'))
      throw new Error('Storage key escapes root directory');
    return path;
  }
  async put(key: string, body: Uint8Array | string): Promise<void> {
    const path = this.path(key);
    await mkdir(join(path, '..'), { recursive: true });
    await writeFile(path, body);
  }
  async get(key: string): Promise<File | null> {
    try {
      const body = await readFile(this.path(key));
      const info = await stat(this.path(key));
      return { key, body, size: info.size, lastModified: info.mtime };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
  }
  async delete(key: string): Promise<void> {
    try {
      await unlink(this.path(key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  async exists(key: string): Promise<boolean> {
    return (await this.get(key)) !== null;
  }
  async list(prefix = ''): Promise<string[]> {
    const walk = async (dir: string, base: string): Promise<string[]> => {
      const out: string[] = [];
      for (const e of await readdir(dir, { withFileTypes: true })) {
        const rel = join(base, e.name);
        if (e.isDirectory()) out.push(...(await walk(join(dir, e.name), rel)));
        else out.push(rel);
      }
      return out;
    };
    try {
      return (await walk(this.directory, '')).filter((k) => k.startsWith(prefix));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }
  }
  async getUrl(key: string): Promise<string> {
    return `file://${this.path(key)}`;
  }
}
