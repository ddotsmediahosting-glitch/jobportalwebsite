import { Router } from 'express';
import { BillingService } from './billing.service';
import { authenticate, requireRole } from '../../middleware/auth';
import { AuthRequest } from '../../middleware/auth';
import { Response } from 'express';

const router = Router();
const service = new BillingService();

router.get('/plans', async (_req, res) => {
  res.json({ success: true, data: await service.getPlans() });
});

router.use(authenticate, requireRole('EMPLOYER', 'ADMIN', 'SUB_ADMIN'));

router.get('/subscription', async (req: AuthRequest, res: Response) => {
  res.json({ success: true, data: await service.getSubscription(req.user!.sub) });
});

router.post('/subscribe', async (req: AuthRequest, res: Response) => {
  const { plan } = req.body;
  const data = await service.subscribe(req.user!.sub, plan);
  res.json({ success: true, data });
});

router.post('/cancel', async (req: AuthRequest, res: Response) => {
  const data = await service.cancel(req.user!.sub);
  res.json({ success: true, ...data });
});

export default router;
