import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import {
  runATSAnalysis,
  runCVGeneration,
  runCoverLetterGeneration,
  runSkillsGapAnalysis,
  runCVOptimization,
  runInterviewQuestions,
  getCVProfile,
  saveCVProfile,
  getAnalysisHistory,
  getAnalysisById,
  deleteAnalysis,
  parseFileToText,
} from './cv.service';
import {
  analyzeSchema,
  generateSchema,
  coverLetterSchema,
  skillsGapSchema,
  optimizeSchema,
  interviewQsSchema,
  saveCVProfileSchema,
} from './cv.schema';

export async function analyzeHandler(req: AuthRequest, res: Response) {
  const userId = req.user!.sub;
  let body = req.body;
  if (req.file) {
    const text = await parseFileToText(req.file.buffer, req.file.mimetype);
    body = { ...body, cvText: text };
  }
  const data = analyzeSchema.parse(body);
  const result = await runATSAnalysis(userId, data);
  res.json({ success: true, data: result });
}

export async function generateHandler(req: AuthRequest, res: Response) {
  const data = generateSchema.parse(req.body);
  const result = await runCVGeneration(data);
  res.json({ success: true, data: result });
}

export async function coverLetterHandler(req: AuthRequest, res: Response) {
  const data = coverLetterSchema.parse(req.body);
  const result = await runCoverLetterGeneration(data);
  res.json({ success: true, data: { coverLetter: result } });
}

export async function skillsGapHandler(req: AuthRequest, res: Response) {
  const userId = req.user!.sub;
  const data = skillsGapSchema.parse(req.body);
  const result = await runSkillsGapAnalysis(userId, data);
  res.json({ success: true, data: result });
}

export async function optimizeHandler(req: AuthRequest, res: Response) {
  const data = optimizeSchema.parse(req.body);
  const result = await runCVOptimization(data);
  res.json({ success: true, data: result });
}

export async function interviewQsHandler(req: AuthRequest, res: Response) {
  const data = interviewQsSchema.parse(req.body);
  const result = await runInterviewQuestions(data);
  res.json({ success: true, data: { questions: result } });
}

export async function getProfileHandler(req: AuthRequest, res: Response) {
  const userId = req.user!.sub;
  const profile = await getCVProfile(userId);
  res.json({ success: true, data: profile });
}

export async function saveProfileHandler(req: AuthRequest, res: Response) {
  const userId = req.user!.sub;
  const data = saveCVProfileSchema.parse(req.body);
  const profile = await saveCVProfile(userId, data);
  res.json({ success: true, data: profile });
}

export async function listAnalysesHandler(req: AuthRequest, res: Response) {
  const userId = req.user!.sub;
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '10', 10);
  const result = await getAnalysisHistory(userId, page, limit);
  res.json({ success: true, data: result });
}

export async function getAnalysisHandler(req: AuthRequest, res: Response) {
  const userId = req.user!.sub;
  const result = await getAnalysisById(req.params.id, userId);
  if (!result) return res.status(404).json({ success: false, error: 'Analysis not found' });
  res.json({ success: true, data: result });
}

export async function deleteAnalysisHandler(req: AuthRequest, res: Response) {
  const userId = req.user!.sub;
  await deleteAnalysis(req.params.id, userId);
  res.json({ success: true });
}

export async function parseFileHandler(req: AuthRequest, res: Response) {
  if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
  const text = await parseFileToText(req.file.buffer, req.file.mimetype);
  res.json({ success: true, data: { text, charCount: text.length } });
}
