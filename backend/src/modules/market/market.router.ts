import { Router, Request, Response } from 'express';
import { getMarketPulse, getRoleIntelligence, getTopRoles } from './market.service';

const router = Router();

/**
 * GET /market/pulse
 * Live market snapshot: stats + AI narrative. Cached 1hr.
 */
router.get('/pulse', async (_req: Request, res: Response) => {
  const data = await getMarketPulse();
  res.json({ success: true, data });
});

/**
 * GET /market/top-roles
 * Most in-demand roles with salary ranges. Cached 1hr.
 */
router.get('/top-roles', async (_req: Request, res: Response) => {
  const data = await getTopRoles();
  res.json({ success: true, data });
});

/**
 * GET /market/role?title=Social+Media+Manager
 * Deep AI intelligence report for a specific role. Cached 30min.
 */
router.get('/role', async (req: Request, res: Response) => {
  const title = (req.query.title as string)?.trim();
  if (!title || title.length < 2) {
    res.status(400).json({ success: false, error: 'title query param is required (min 2 chars)' });
    return;
  }
  if (title.length > 100) {
    res.status(400).json({ success: false, error: 'title too long (max 100 chars)' });
    return;
  }
  const data = await getRoleIntelligence(title);
  res.json({ success: true, data });
});

export default router;
