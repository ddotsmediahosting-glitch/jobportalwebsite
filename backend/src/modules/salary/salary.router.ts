import { Router } from 'express';
import { SalaryService } from './salary.service';
import { authenticate } from '../../middleware/auth';
import { AuthRequest } from '../../middleware/auth';
import { Response } from 'express';

const router = Router();
const svc = new SalaryService();

router.get('/explore', async (req, res) => {
  const { jobTitle, industry, emirate, experienceMin, experienceMax } = req.query as Record<string, string>;
  const data = await svc.explore({
    jobTitle,
    industry,
    emirate,
    experienceMin: experienceMin ? Number(experienceMin) : undefined,
    experienceMax: experienceMax ? Number(experienceMax) : undefined,
  });
  res.json({ success: true, data });
});

router.get('/top-roles', async (req, res) => {
  const { emirate, limit = '20' } = req.query as Record<string, string>;
  const data = await svc.topRoles(emirate, Number(limit));
  res.json({ success: true, data });
});

router.get('/industries', async (req, res) => {
  const data = await svc.industries();
  res.json({ success: true, data });
});

router.post('/submit', async (req: AuthRequest, res: Response) => {
  const userId = (req as AuthRequest).user?.sub;
  const data = await svc.submitSalary(userId, req.body);
  res.status(201).json({ success: true, data });
});

export default router;
