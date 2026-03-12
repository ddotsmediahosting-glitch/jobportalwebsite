import { Request, Response } from 'express';
import {
  getOrCreateSession,
  logInbound,
  sendWhatsApp,
  validateTwilioSignature,
  getWhatsAppStats,
  isTwilioConfigured,
} from './whatsapp.service';
import { handleMessage } from './chatbot.service';
import { config } from '../../config';
import prisma from '../../lib/prisma';

export class WhatsAppController {
  // ── POST /whatsapp/webhook — Twilio inbound messages ─────────────────────────
  async webhook(req: Request, res: Response) {
    // Validate Twilio signature in production
    if (config.isProduction) {
      const sig = req.headers['x-twilio-signature'] as string;
      const webhookUrl = config.twilio.webhookUrl || `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      const params = req.body as Record<string, string>;
      if (!validateTwilioSignature(sig, webhookUrl, params)) {
        return res.status(403).send('Forbidden: Invalid Twilio signature');
      }
    }

    const {
      From,       // whatsapp:+971501234567
      Body,
      WaId,
      ProfileName,
      MessageSid,
      To,
      MediaUrl0,
    } = req.body as Record<string, string>;

    if (!From || !Body) {
      return res.status(200).send('<?xml version="1.0"?><Response></Response>');
    }

    // Extract E.164 phone number
    const phoneNumber = From.replace('whatsapp:', '');

    try {
      // Get or create session
      const session = await getOrCreateSession(phoneNumber, WaId, ProfileName);

      // Log inbound message
      await logInbound({
        sessionId: session.id,
        messageSid: MessageSid,
        from: From,
        to: To,
        body: Body,
        mediaUrl: MediaUrl0,
      });

      // Process through chatbot (async – Twilio expects fast response)
      setImmediate(() => {
        handleMessage({
          from: phoneNumber,
          body: Body,
          waId: WaId,
          profileName: ProfileName,
          session: {
            id: session.id,
            state: session.state,
            contextJson: session.contextJson,
            optedOut: session.optedOut,
            profileName: session.profileName,
          },
        }).catch((err) => console.error('[WhatsApp chatbot error]', err));
      });
    } catch (err) {
      console.error('[WhatsApp webhook error]', err);
    }

    // Respond immediately with empty TwiML
    res.type('application/xml');
    res.send('<?xml version="1.0"?><Response></Response>');
  }

  // ── GET /admin/whatsapp/stats ─────────────────────────────────────────────────
  async getStats(_req: Request, res: Response) {
    const stats = await getWhatsAppStats();
    res.json({ success: true, data: stats });
  }

  // ── GET /admin/whatsapp/sessions ──────────────────────────────────────────────
  async getSessions(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const [sessions, total] = await Promise.all([
      prisma.whatsAppSession.findMany({
        orderBy: { lastActiveAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          phoneNumber: true,
          profileName: true,
          state: true,
          optedOut: true,
          lastActiveAt: true,
          createdAt: true,
        },
      }),
      prisma.whatsAppSession.count(),
    ]);
    res.json({ success: true, data: { sessions, total, page, pages: Math.ceil(total / limit) } });
  }

  // ── GET /admin/whatsapp/messages ──────────────────────────────────────────────
  async getMessages(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 50;
    const [messages, total] = await Promise.all([
      prisma.whatsAppMessage.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.whatsAppMessage.count(),
    ]);
    res.json({ success: true, data: { messages, total, page, pages: Math.ceil(total / limit) } });
  }

  // ── POST /admin/whatsapp/send — test message from admin ──────────────────────
  async sendTestMessage(req: Request, res: Response) {
    const { to, message } = req.body;
    if (!to || !message) return res.status(400).json({ success: false, error: 'to and message required' });
    if (!isTwilioConfigured()) return res.status(503).json({ success: false, error: 'Twilio not configured' });
    const sid = await sendWhatsApp(to, message);
    res.json({ success: true, data: { sid } });
  }

  // ── DELETE /admin/whatsapp/sessions/:id — clear session ──────────────────────
  async clearSession(req: Request, res: Response) {
    await prisma.whatsAppSession.update({
      where: { id: req.params.id },
      data: { state: 'idle', contextJson: undefined },
    });
    res.json({ success: true });
  }
}
