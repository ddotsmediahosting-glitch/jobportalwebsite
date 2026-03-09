import { Router } from 'express';
import { MarketingController } from './marketing.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();
const ctrl = new MarketingController();

// Public: track a share click (called client-side after sharing)
router.post('/track', ctrl.trackShare.bind(ctrl));

// Authenticated employer routes
router.get('/job/:id/stats', authenticate, ctrl.getJobStats.bind(ctrl));
router.get('/employer/stats', authenticate, requireRole('EMPLOYER'), ctrl.getEmployerStats.bind(ctrl));
router.post('/generate-post', authenticate, requireRole('EMPLOYER', 'ADMIN'), ctrl.generatePost.bind(ctrl));
router.post('/utm-link', authenticate, ctrl.buildUtmLink.bind(ctrl));

export default router;
