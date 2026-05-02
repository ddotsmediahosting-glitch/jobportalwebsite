import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config';

// ─── Interface ─────────────────────────────────────────────────────────────────

export interface StorageAdapter {
  save(fileBuffer: Buffer, fileName: string, mimeType: string, folder: string): Promise<string>;
  delete(fileUrl: string): Promise<void>;
  read(fileUrl: string): Promise<Buffer | null>;
  getSignedUrl?(key: string, expiresIn?: number): Promise<string>;
}

// ─── Local adapter ─────────────────────────────────────────────────────────────

class LocalStorageAdapter implements StorageAdapter {
  private baseDir: string;
  private baseUrl: string;

  constructor() {
    this.baseDir = path.resolve(config.storage.uploadDir);
    this.baseUrl = '/uploads';
    fs.mkdirSync(this.baseDir, { recursive: true });
  }

  async save(fileBuffer: Buffer, fileName: string, _mimeType: string, folder: string): Promise<string> {
    const dir = path.join(this.baseDir, folder);
    fs.mkdirSync(dir, { recursive: true });

    const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const unique = `${Date.now()}-${sanitized}`;
    const filePath = path.join(dir, unique);

    fs.writeFileSync(filePath, fileBuffer);
    return `${this.baseUrl}/${folder}/${unique}`;
  }

  async delete(fileUrl: string): Promise<void> {
    const relative = fileUrl.replace(this.baseUrl, '');
    const filePath = path.join(this.baseDir, relative);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  async read(fileUrl: string): Promise<Buffer | null> {
    const relative = fileUrl.replace(this.baseUrl, '');
    const filePath = path.join(this.baseDir, relative);
    if (!fs.existsSync(filePath)) return null;
    return fs.promises.readFile(filePath);
  }
}

// ─── S3 adapter ────────────────────────────────────────────────────────────────

class S3StorageAdapter implements StorageAdapter {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = config.storage.s3.bucket;
    this.client = new S3Client({
      region: config.storage.s3.region,
      credentials: {
        accessKeyId: config.storage.s3.accessKeyId,
        secretAccessKey: config.storage.s3.secretAccessKey,
      },
      ...(config.storage.s3.endpoint ? { endpoint: config.storage.s3.endpoint } : {}),
    });
  }

  async save(fileBuffer: Buffer, fileName: string, mimeType: string, folder: string): Promise<string> {
    const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `${folder}/${Date.now()}-${sanitized}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
      })
    );

    return `https://${this.bucket}.s3.${config.storage.s3.region}.amazonaws.com/${key}`;
  }

  async delete(fileUrl: string): Promise<void> {
    const key = new URL(fileUrl).pathname.slice(1);
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async read(fileUrl: string): Promise<Buffer | null> {
    const key = new URL(fileUrl).pathname.slice(1);
    const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    if (!result.Body) return null;
    const chunks: Buffer[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for await (const chunk of result.Body as any) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, cmd, { expiresIn });
  }
}

// ─── Factory ───────────────────────────────────────────────────────────────────

export const storage: StorageAdapter =
  config.storage.provider === 's3' ? new S3StorageAdapter() : new LocalStorageAdapter();
