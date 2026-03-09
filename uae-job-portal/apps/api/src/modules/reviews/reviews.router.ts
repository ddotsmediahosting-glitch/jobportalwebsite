import { Router } from 'express';
import { ReviewsService } from './reviews.service';
import { authenticate, requireRole } from '../../middleware/auth';
import { AuthRequest } from '../../middleware/auth';
import { Response } from 'express';

const router = Router();
const svc = new ReviewsService();

// Public: get approved reviews + stats for a company
router.get('/employers/:slug/reviews', async (req, res) => {
  const { page = '1', limit = '10' } = req.query as Record<string, string>;
  const data = await svc.getEmployerReviews(req.params.slug, Number(page), Number(limit));
  res.json({ success: true, data });
});

// Auth: submit a review
router.post('/employers/:slug/reviews', authenticate, async (req: AuthRequest, res: Response) => {
  const data = await svc.submitReview(req.user!.sub, req.params.slug, req.body);
  res.status(201).json({ success: true, data });
});

// Public: mark review helpful
router.post('/reviews/:id/helpful', async (req, res) => {
  const data = await svc.markHelpful(req.params.id);
  res.json({ success: true, data });
});

// Admin routes
router.get('/admin/reviews', authenticate, requireRole('ADMIN', 'SUB_ADMIN'), async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '20', status } = req.query as Record<string, string>;
  const data = await svc.adminListReviews(Number(page), Number(limit), status);
  res.json({ success: true, data });
});

router.patch('/admin/reviews/:id', authenticate, requireRole('ADMIN', 'SUB_ADMIN'), async (req: AuthRequest, res: Response) => {
  const data = await svc.adminModerateReview(req.params.id, req.body.status);
  res.json({ success: true, data });
});

export default router;
