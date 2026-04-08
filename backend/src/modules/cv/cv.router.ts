import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../middleware/auth';
import {
  analyzeHandler,
  generateHandler,
  coverLetterHandler,
  skillsGapHandler,
  optimizeHandler,
  interviewQsHandler,
  getProfileHandler,
  saveProfileHandler,
  listAnalysesHandler,
  getAnalysisHandler,
  deleteAnalysisHandler,
  parseFileHandler,
} from './cv.controller';

const router = Router();

// File upload (in memory for parsing)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

// All routes require authentication
router.use(authenticate);

// ── AI endpoints ──────────────────────────────────────────────────────────────
/* eslint-disable @typescript-eslint/no-explicit-any */
router.post('/analyze', upload.single('cvFile') as any, analyzeHandler);
router.post('/generate', generateHandler);
router.post('/cover-letter', coverLetterHandler);
router.post('/skills-gap', skillsGapHandler);
router.post('/optimize', optimizeHandler);
router.post('/interview-questions', interviewQsHandler);
router.post('/parse-file', upload.single('cvFile') as any, parseFileHandler);
/* eslint-enable @typescript-eslint/no-explicit-any */

// ── Profile ───────────────────────────────────────────────────────────────────
router.get('/profile', getProfileHandler);
router.put('/profile', saveProfileHandler);

// ── History ───────────────────────────────────────────────────────────────────
router.get('/analyses', listAnalysesHandler);
router.get('/analyses/:id', getAnalysisHandler);
router.delete('/analyses/:id', deleteAnalysisHandler);

export default router;
