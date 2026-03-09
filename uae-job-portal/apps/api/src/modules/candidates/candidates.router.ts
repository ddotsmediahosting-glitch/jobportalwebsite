import { Router } from 'express';
import { CandidatesService } from './candidates.service';
import { authenticate, requireRole } from '../../middleware/auth';
import { AuthRequest } from '../../middleware/auth';
import { Response } from 'express';

const router = Router();
const svc = new CandidatesService();

// All candidate routes require auth
router.use(authenticate);

// Employer: search candidates
router.get('/search', requireRole('EMPLOYER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  const { q, emirate, skills, workMode, experienceMin, experienceMax, page = '1', limit = '20' } = req.query as Record<string, string>;
  const data = await svc.searchCandidates(req.user!.sub, {
    q, emirate, skills, workMode,
    experienceMin: experienceMin ? Number(experienceMin) : undefined,
    experienceMax: experienceMax ? Number(experienceMax) : undefined,
    page: Number(page), limit: Number(limit),
  });
  res.json({ success: true, data });
});

// Employer: save candidate
router.post('/save/:seekerUserId', requireRole('EMPLOYER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  const { notes, tags } = req.body;
  const data = await svc.saveCandidate(req.user!.sub, req.params.seekerUserId, notes, tags);
  res.status(201).json({ success: true, data });
});

// Employer: remove saved candidate
router.delete('/save/:seekerUserId', requireRole('EMPLOYER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  const data = await svc.removeSavedCandidate(req.user!.sub, req.params.seekerUserId);
  res.json({ success: true, data });
});

// Employer: get saved candidates
router.get('/saved', requireRole('EMPLOYER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '20' } = req.query as Record<string, string>;
  const data = await svc.getSavedCandidates(req.user!.sub, Number(page), Number(limit));
  res.json({ success: true, data });
});

// Employer: propose interview
router.post('/interviews/propose/:applicationId', requireRole('EMPLOYER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  const data = await svc.proposeInterview(req.user!.sub, req.params.applicationId, req.body);
  res.status(201).json({ success: true, data });
});

// Seeker: confirm/cancel interview
router.patch('/interviews/:slotId/respond', requireRole('SEEKER'), async (req: AuthRequest, res: Response) => {
  const { action } = req.body;
  const data = await svc.respondToInterview(req.user!.sub, req.params.slotId, action);
  res.json({ success: true, data });
});

// Get interview slots (seeker or employer)
router.get('/interviews', async (req: AuthRequest, res: Response) => {
  const role = req.user!.role as 'SEEKER' | 'EMPLOYER';
  const data = await svc.getInterviewSlots(req.user!.sub, role === 'EMPLOYER' ? 'EMPLOYER' : 'SEEKER');
  res.json({ success: true, data });
});

export default router;
