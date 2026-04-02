import { Router } from 'express';
import { NotificationsService } from './notifications.service';
import { authenticate } from '../../middleware/auth';
import { AuthRequest } from '../../middleware/auth';
import { Response } from 'express';
import prisma from '../../lib/prisma';

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

// ── Mobile push notification device token registration ────────────────────────
// Called by the Expo React Native app after permission granted.
// Stores (upserts) the Expo push token so the backend can send push notifications.
router.post('/push-token', async (req: AuthRequest, res: Response) => {
  const { token, platform } = req.body as { token?: string; platform?: string };
  if (!token || !platform) {
    return res.status(400).json({ success: false, error: 'token and platform are required' });
  }
  await prisma.deviceToken.upsert({
    where: { userId_token: { userId: req.user!.sub, token } },
    update: { platform, updatedAt: new Date() },
    create: { userId: req.user!.sub, token, platform },
  });
  res.json({ success: true, message: 'Push token registered' });
});

// Remove push token on logout or permission revoked
router.delete('/push-token', async (req: AuthRequest, res: Response) => {
  const { token } = req.body as { token?: string };
  if (!token) return res.status(400).json({ success: false, error: 'token is required' });
  await prisma.deviceToken.deleteMany({
    where: { userId: req.user!.sub, token },
  });
  res.json({ success: true, message: 'Push token removed' });
});

export default router;
