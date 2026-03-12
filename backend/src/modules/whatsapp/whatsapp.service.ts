import twilio from 'twilio';
import { config } from '../../config';
import prisma from '../../lib/prisma';

// Lazy-init client so missing credentials don't crash startup
let _client: twilio.Twilio | null = null;

function getClient(): twilio.Twilio {
  if (!_client) {
    if (!config.twilio.accountSid || !config.twilio.authToken) {
      throw new Error('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.');
    }
    _client = twilio(config.twilio.accountSid, config.twilio.authToken);
  }
  return _client;
}

export function isTwilioConfigured(): boolean {
  return !!(config.twilio.accountSid && config.twilio.authToken);
}

// ── Send a WhatsApp message via Twilio ─────────────────────────────────────────
export async function sendWhatsApp(to: string, body: string, sessionId?: string): Promise<string | null> {
  if (!isTwilioConfigured()) {
    console.warn('[WhatsApp] Twilio not configured – message not sent.');
    return null;
  }

  const client = getClient();
  const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  const from = config.twilio.whatsappFrom;

  const message = await client.messages.create({ from, to: toFormatted, body });

  // Log outbound message
  await prisma.whatsAppMessage.create({
    data: {
      sessionId,
      messageSid: message.sid,
      from,
      to: toFormatted,
      body,
      direction: 'outbound',
      status: 'sent',
    },
  });

  return message.sid;
}

// ── Validate Twilio webhook signature ──────────────────────────────────────────
export function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>,
): boolean {
  if (!config.twilio.authToken) return false;
  return twilio.validateRequest(config.twilio.authToken, signature, url, params);
}

// ── Get or create a WhatsApp session ──────────────────────────────────────────
export async function getOrCreateSession(phoneNumber: string, waId?: string, profileName?: string) {
  const session = await prisma.whatsAppSession.upsert({
    where: { phoneNumber },
    update: {
      lastActiveAt: new Date(),
      ...(waId && { waId }),
      ...(profileName && { profileName }),
    },
    create: {
      phoneNumber,
      waId,
      profileName,
      state: 'idle',
    },
  });
  return session;
}

// ── Update session state ────────────────────────────────────────────────────────
export async function updateSessionState(
  sessionId: string,
  state: string,
  context?: Record<string, unknown>,
) {
  return prisma.whatsAppSession.update({
    where: { id: sessionId },
    data: {
      state,
      contextJson: context as any ?? undefined,
      lastActiveAt: new Date(),
    },
  });
}

// ── Log inbound message ────────────────────────────────────────────────────────
export async function logInbound(data: {
  sessionId: string;
  messageSid: string;
  from: string;
  to: string;
  body: string;
  mediaUrl?: string;
}) {
  return prisma.whatsAppMessage.create({
    data: {
      sessionId: data.sessionId,
      messageSid: data.messageSid,
      from: data.from,
      to: data.to,
      body: data.body,
      direction: 'inbound',
      status: 'received',
      mediaUrl: data.mediaUrl,
    },
  });
}

// ── Admin stats ────────────────────────────────────────────────────────────────
export async function getWhatsAppStats() {
  const [totalSessions, activeSessions, totalMessages, inbound, outbound, recentMessages] =
    await Promise.all([
      prisma.whatsAppSession.count(),
      prisma.whatsAppSession.count({
        where: { lastActiveAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
      prisma.whatsAppMessage.count(),
      prisma.whatsAppMessage.count({ where: { direction: 'inbound' } }),
      prisma.whatsAppMessage.count({ where: { direction: 'outbound' } }),
      prisma.whatsAppMessage.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { from: true, to: true, body: true, direction: true, createdAt: true, status: true },
      }),
    ]);

  // Daily message trend (7 days)
  const since = new Date();
  since.setDate(since.getDate() - 6);
  const dailyRaw = await prisma.whatsAppMessage.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true, direction: true },
  });

  const dailyMap: Record<string, { inbound: number; outbound: number }> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    dailyMap[d.toISOString().split('T')[0]] = { inbound: 0, outbound: 0 };
  }
  dailyRaw.forEach((m) => {
    const key = m.createdAt.toISOString().split('T')[0];
    if (key in dailyMap) dailyMap[key][m.direction as 'inbound' | 'outbound']++;
  });

  // State distribution
  const stateGroups = await prisma.whatsAppSession.groupBy({
    by: ['state'],
    _count: { _all: true },
  });

  return {
    totalSessions,
    activeSessions,
    totalMessages,
    inbound,
    outbound,
    recentMessages,
    daily: Object.entries(dailyMap).map(([date, counts]) => ({ date, ...counts })),
    stateDistribution: stateGroups.map((g) => ({ state: g.state, count: g._count._all })),
    isConfigured: isTwilioConfigured(),
    webhookUrl: config.twilio.webhookUrl || `${process.env.BACKEND_URL || 'https://api.ddotsmedia.com'}/api/v1/whatsapp/webhook`,
    sandboxNumber: config.twilio.whatsappFrom.replace('whatsapp:', ''),
  };
}
