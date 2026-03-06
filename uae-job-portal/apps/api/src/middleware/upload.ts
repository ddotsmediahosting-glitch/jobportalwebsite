import multer from 'multer';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { AppError } from './errorHandler';

const MB = 1024 * 1024;

export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many uploads, please try again later.',
});

function createUpload(allowedMimes: readonly string[], maxSizeMb = 10) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSizeMb * MB },
    fileFilter: (_req, file, cb) => {
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new AppError(400, `File type not allowed. Allowed: ${allowedMimes.join(', ')}`));
      }
    },
  });
}

export const resumeUpload = createUpload(config.uploadLimits.allowedMimeTypes.resume, 10);
export const imageUpload = createUpload(config.uploadLimits.allowedMimeTypes.image, 5);
export const documentUpload = createUpload(config.uploadLimits.allowedMimeTypes.document, 10);
