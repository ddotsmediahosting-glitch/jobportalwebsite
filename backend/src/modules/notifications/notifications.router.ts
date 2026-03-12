import { Router } from 'express';
import { NotificationsService } from './notifications.service';
import { authenticate } from '../../middleware/auth';
import { AuthRequest } from '../../middleware/auth';
import { Response } from 'express';

const router = Router();
const service = new NotificationsService();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  const { page, limit } = req.query as { page?: string; limit?: string };
  res.json({ success: true, data: await service.getNotifications(req.user!.sub, +page! || 1, +limit! || 20) });
});

router.patch('/:id/read', async (req: AuthRequest, res: Response) => {
  const data = await service.markRead(req.user!.sub, req.params.id);
  res.json({ success: true, ...data });
});

router.patch('/read-all', async (req: AuthRequest, res: Response) => {
  const data = await service.markAllRead(req.user!.sub);
  res.json({ success: true, ...data });
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const data = await service.deleteNotification(req.user!.sub, req.params.id);
  res.json({ success: true, ...data });
});

export default router;
