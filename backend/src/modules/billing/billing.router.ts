import { Router, Request, Response } from 'express';
import express from 'express';
import { BillingService } from './billing.service';
import { authenticate, requireRole } from '../../middleware/auth';
import { AuthRequest } from '../../middleware/auth';
import { config } from '../../config';
import prisma from '../../lib/prisma';

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

// ── Stripe Webhook (raw body required) ────────────────────────────────────────
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    if (config.billing.provider !== 'stripe') {
      return res.json({ received: true });
    }

    const sig = req.headers['stripe-signature'] as string;
    if (!sig || !config.billing.stripeWebhookSecret) {
      return res.status(400).json({ error: 'Missing stripe signature' });
    }

    try {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(config.billing.stripeSecretKey, { apiVersion: '2024-06-20' });
      const event = stripe.webhooks.constructEvent(req.body, sig, config.billing.stripeWebhookSecret);

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as { metadata?: { employerId?: string; plan?: string }; subscription?: string };
        const { employerId, plan } = session.metadata || {};
        if (employerId && plan && session.subscription) {
          await prisma.subscription.upsert({
            where: { employerId },
            update: {
              plan: plan as 'FREE' | 'STANDARD' | 'PREMIUM',
              status: 'ACTIVE',
              providerSubId: session.subscription as string,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
            create: {
              employerId,
              plan: plan as 'FREE' | 'STANDARD' | 'PREMIUM',
              status: 'ACTIVE',
              provider: 'stripe',
              providerSubId: session.subscription as string,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });
        }
      }

      if (event.type === 'customer.subscription.deleted') {
        const sub = event.data.object as { id: string };
        await prisma.subscription.updateMany({
          where: { providerSubId: sub.id },
          data: { status: 'CANCELLED', cancelledAt: new Date() },
        });
      }

      res.json({ received: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Webhook error';
      res.status(400).json({ error: message });
    }
  },
);

export default router;
