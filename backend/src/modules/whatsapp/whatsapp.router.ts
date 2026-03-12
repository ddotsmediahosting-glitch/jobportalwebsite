import { Router } from 'express';
import { WhatsAppController } from './whatsapp.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();
const ctrl = new WhatsAppController();

// ── Public webhook (called by Twilio, no auth) ────────────────────────────────
// Use raw body parser for Twilio signature validation
router.post('/webhook', ctrl.webhook.bind(ctrl));

// ── Admin routes ──────────────────────────────────────────────────────────────
router.get('/stats', authenticate, requireRole('ADMIN', 'SUB_ADMIN'), ctrl.getStats.bind(ctrl));
router.get('/sessions', authenticate, requireRole('ADMIN', 'SUB_ADMIN'), ctrl.getSessions.bind(ctrl));
router.get('/messages', authenticate, requireRole('ADMIN', 'SUB_ADMIN'), ctrl.getMessages.bind(ctrl));
router.post('/send', authenticate, requireRole('ADMIN', 'SUB_ADMIN'), ctrl.sendTestMessage.bind(ctrl));
router.delete('/sessions/:id', authenticate, requireRole('ADMIN'), ctrl.clearSession.bind(ctrl));

export default router;
