import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";

export interface StorageProvider {
  save(file: Express.Multer.File, folder: string): Promise<string>;
}

class LocalStorageProvider implements StorageProvider {
  async save(file: Express.Multer.File, folder: string): Promise<string> {
    const dir = path.resolve(env.localUploadDir, folder);
    await fs.mkdir(dir, { recursive: true });
    const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
    const destination = path.join(dir, fileName);
    await fs.writeFile(destination, file.buffer);
    return `/${env.localUploadDir}/${folder}/${fileName}`.replace(/\\/g, "/");
  }
}

class S3CompatibleStorageProvider implements StorageProvider {
  async save(file: Express.Multer.File, folder: string): Promise<string> {
    // Adapter placeholder for MinIO/S3 SDK integration.
    const local = new LocalStorageProvider();
    return local.save(file, folder);
  }
}

export const storageProvider: StorageProvider =
  env.storageDriver === "s3" ? new S3CompatibleStorageProvider() : new LocalStorageProvider();
