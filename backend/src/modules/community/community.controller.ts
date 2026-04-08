import { Request, Response } from 'express';
import prisma from '../../lib/prisma';

const CATEGORIES = [
  'GENERAL', 'VISA_WORK_PERMITS', 'SALARY_COMPENSATION', 'JOB_SEARCH',
  'INTERVIEW_HELP', 'CAREER_ADVICE', 'COMPANY_REVIEWS', 'UAE_WORK_LAWS',
  'INDUSTRY', 'EMIRATIZATION', 'FREELANCE_REMOTE', 'NETWORKING', 'RELOCATING',
];

function getIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(',')[0].trim();
  return req.ip || 'unknown';
}

// ── Public ──────────────────────────────────────────────────────────────────

export async function listDiscussions(req: Request, res: Response) {
  const {
    category, tag, search, sort = 'latest', page = '1', limit = '20', unanswered,
  } = req.query as Record<string, string>;

  const take = Math.min(parseInt(limit) || 20, 50);
  const skip = (parseInt(page) - 1) * take;

  const where: any = { status: 'APPROVED' };
  if (category && CATEGORIES.includes(category)) where.category = category;
  if (tag) where.tags = { array_contains: tag };
  if (unanswered === 'true') where.isAnswered = false;
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { body: { contains: search } },
    ];
  }

  let orderBy: any[] = [{ isPinned: 'desc' }];
  if (sort === 'top') orderBy.push({ upvoteCount: 'desc' });
  else if (sort === 'unanswered') orderBy.push({ replyCount: 'asc' }, { createdAt: 'desc' });
  else if (sort === 'active') orderBy.push({ updatedAt: 'desc' });
  else orderBy.push({ createdAt: 'desc' });

  const [total, items] = await Promise.all([
    prisma.discussion.count({ where }),
    prisma.discussion.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        id: true, title: true, category: true, tags: true, isPinned: true,
        isAnswered: true, isAnonymous: true, viewCount: true, upvoteCount: true,
        replyCount: true, authorName: true, authorId: true, createdAt: true,
        _count: { select: { replies: true } },
      },
    }),
  ]);

  // Scrub author emails
  const safe = items.map((d) => ({
    ...d,
    authorName: d.isAnonymous ? 'Anonymous' : (d.authorName || 'Community Member'),
  }));

  res.json({ success: true, data: { items: safe, total, page: parseInt(page), totalPages: Math.ceil(total / take) } });
}

export async function getDiscussion(req: Request, res: Response) {
  const { id } = req.params;
  const discussion = await prisma.discussion.findUnique({
    where: { id, status: 'APPROVED' },
    include: {
      replies: {
        orderBy: [{ isAccepted: 'desc' }, { upvoteCount: 'desc' }, { createdAt: 'asc' }],
        select: {
          id: true, body: true, isAccepted: true, isAdminReply: true, isAnonymous: true,
          upvoteCount: true, authorName: true, authorId: true, createdAt: true,
        },
      },
    },
  });
  if (!discussion) return res.status(404).json({ success: false, error: 'Discussion not found' });

  // Increment view
  await prisma.discussion.update({ where: { id }, data: { viewCount: { increment: 1 } } });

  const ip = getIp(req);
  const voted = await prisma.discussionVote.findUnique({ where: { discussionId_voterIp: { discussionId: id, voterIp: ip } } });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = discussion as any;
  const safe = {
    ...discussion,
    authorName: discussion.isAnonymous ? 'Anonymous' : (discussion.authorName || 'Community Member'),
    authorEmail: undefined,
    authorIp: undefined,
    hasVoted: !!voted,
    replies: (d.replies ?? []).map((r: Record<string, unknown>) => ({
      ...r,
      authorName: r['isAnonymous'] ? 'Anonymous' : (r['authorName'] || 'Community Member'),
    })),
  };

  res.json({ success: true, data: safe });
}

export async function createDiscussion(req: Request, res: Response) {
  const { title, body, category = 'GENERAL', tags = [], isAnonymous = false, authorName, authorEmail } = req.body;
  if (!title?.trim() || !body?.trim()) return res.status(400).json({ success: false, error: 'Title and body are required' });
  if (title.length > 200) return res.status(400).json({ success: false, error: 'Title too long (max 200 chars)' });
  if (body.length > 5000) return res.status(400).json({ success: false, error: 'Body too long (max 5000 chars)' });

  const settings = await prisma.communitySettings.findUnique({ where: { id: 'main' } });
  const requireMod = settings?.requireModeration ?? true;

  const ip = getIp(req);
  const userId = (req as any).user?.sub;

  const d = await prisma.discussion.create({
    data: {
      title: title.trim(),
      body: body.trim(),
      category: CATEGORIES.includes(category) ? category : 'GENERAL',
      tags: Array.isArray(tags) ? tags.slice(0, 5).map((t: string) => t.trim().toLowerCase()) : [],
      isAnonymous: !!isAnonymous,
      authorId: userId || null,
      authorName: isAnonymous ? null : (authorName?.trim() || null),
      authorEmail: authorEmail?.trim() || null,
      authorIp: ip,
      status: requireMod ? 'PENDING' : 'APPROVED',
    },
  });

  res.status(201).json({ success: true, data: d, pending: requireMod });
}

export async function createReply(req: Request, res: Response) {
  const { id } = req.params;
  const { body, isAnonymous = false, authorName, authorEmail } = req.body;
  if (!body?.trim()) return res.status(400).json({ success: false, error: 'Reply body is required' });
  if (body.length > 3000) return res.status(400).json({ success: false, error: 'Reply too long (max 3000 chars)' });

  const discussion = await prisma.discussion.findUnique({ where: { id, status: 'APPROVED' } });
  if (!discussion) return res.status(404).json({ success: false, error: 'Discussion not found' });
  if (discussion.status === 'CLOSED') return res.status(400).json({ success: false, error: 'This discussion is closed' });

  const ip = getIp(req);
  const userId = (req as any).user?.sub;

  const [reply] = await prisma.$transaction([
    prisma.discussionReply.create({
      data: {
        body: body.trim(),
        isAnonymous: !!isAnonymous,
        authorId: userId || null,
        authorName: isAnonymous ? null : (authorName?.trim() || null),
        authorEmail: authorEmail?.trim() || null,
        authorIp: ip,
        discussionId: id,
      },
    }),
    prisma.discussion.update({ where: { id }, data: { replyCount: { increment: 1 }, updatedAt: new Date() } }),
  ]);

  res.status(201).json({ success: true, data: reply });
}

export async function voteDiscussion(req: Request, res: Response) {
  const { id } = req.params;
  const ip = getIp(req);

  const existing = await prisma.discussionVote.findUnique({
    where: { discussionId_voterIp: { discussionId: id, voterIp: ip } },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.discussionVote.delete({ where: { id: existing.id } }),
      prisma.discussion.update({ where: { id }, data: { upvoteCount: { decrement: 1 } } }),
    ]);
    return res.json({ success: true, voted: false });
  }

  await prisma.$transaction([
    prisma.discussionVote.create({ data: { discussionId: id, voterIp: ip } }),
    prisma.discussion.update({ where: { id }, data: { upvoteCount: { increment: 1 } } }),
  ]);
  res.json({ success: true, voted: true });
}

export async function voteReply(req: Request, res: Response) {
  const { id } = req.params;
  const ip = getIp(req);

  const existing = await prisma.discussionReplyVote.findUnique({
    where: { replyId_voterIp: { replyId: id, voterIp: ip } },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.discussionReplyVote.delete({ where: { id: existing.id } }),
      prisma.discussionReply.update({ where: { id }, data: { upvoteCount: { decrement: 1 } } }),
    ]);
    return res.json({ success: true, voted: false });
  }

  await prisma.$transaction([
    prisma.discussionReplyVote.create({ data: { replyId: id, voterIp: ip } }),
    prisma.discussionReply.update({ where: { id }, data: { upvoteCount: { increment: 1 } } }),
  ]);
  res.json({ success: true, voted: true });
}

export async function getPublicSettings(_req: Request, res: Response) {
  const settings = await prisma.communitySettings.findUnique({ where: { id: 'main' } });
  res.json({
    success: true,
    data: {
      whatsappNumber: settings?.whatsappNumber || null,
      whatsappGroupLink: settings?.whatsappGroupLink || null,
      contactEmail: settings?.contactEmail || null,
      telegramLink: settings?.telegramLink || null,
      bannerText: settings?.bannerText || null,
      bannerEnabled: settings?.bannerEnabled ?? false,
      allowAnonymous: settings?.allowAnonymous ?? true,
    },
  });
}

// ── Admin ───────────────────────────────────────────────────────────────────

export async function adminListDiscussions(req: Request, res: Response) {
  const { status, category, search, page = '1', limit = '20' } = req.query as Record<string, string>;
  const take = Math.min(parseInt(limit) || 20, 100);
  const skip = (parseInt(page) - 1) * take;

  const where: any = {};
  if (status) where.status = status;
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { authorEmail: { contains: search } },
      { authorName: { contains: search } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.discussion.count({ where }),
    prisma.discussion.findMany({
      where, orderBy: { createdAt: 'desc' }, skip, take,
      include: { _count: { select: { replies: true } } },
    }),
  ]);

  res.json({ success: true, data: { items, total, page: parseInt(page), totalPages: Math.ceil(total / take) } });
}

export async function adminGetDiscussion(req: Request, res: Response) {
  const { id } = req.params;
  const d = await prisma.discussion.findUnique({
    where: { id },
    include: { replies: { orderBy: { createdAt: 'asc' } } },
  });
  if (!d) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({ success: true, data: d });
}

export async function adminUpdateDiscussion(req: Request, res: Response) {
  const { id } = req.params;
  const { status, isPinned, isAnswered, adminNote, title, body, category, tags } = req.body;
  const data: any = {};
  if (status !== undefined) {
    data.status = status;
    if (status === 'CLOSED') data.closedAt = new Date();
  }
  if (isPinned !== undefined) {
    data.isPinned = isPinned;
    data.pinnedAt = isPinned ? new Date() : null;
  }
  if (isAnswered !== undefined) data.isAnswered = isAnswered;
  if (adminNote !== undefined) data.adminNote = adminNote;
  if (title !== undefined) data.title = title.trim();
  if (body !== undefined) data.body = body.trim();
  if (category !== undefined) data.category = category;
  if (tags !== undefined) data.tags = tags;

  const d = await prisma.discussion.update({ where: { id }, data });
  res.json({ success: true, data: d });
}

export async function adminDeleteDiscussion(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.discussion.delete({ where: { id } });
  res.json({ success: true });
}

export async function adminAcceptReply(req: Request, res: Response) {
  const { id } = req.params;
  const reply = await prisma.discussionReply.findUnique({ where: { id } });
  if (!reply) return res.status(404).json({ success: false, error: 'Reply not found' });

  // Unaccept all other replies first
  await prisma.discussionReply.updateMany({
    where: { discussionId: reply.discussionId },
    data: { isAccepted: false },
  });

  const [updated] = await prisma.$transaction([
    prisma.discussionReply.update({ where: { id }, data: { isAccepted: true } }),
    prisma.discussion.update({ where: { id: reply.discussionId }, data: { isAnswered: true } }),
  ]);

  res.json({ success: true, data: updated });
}

export async function adminDeleteReply(req: Request, res: Response) {
  const { id } = req.params;
  const reply = await prisma.discussionReply.findUnique({ where: { id } });
  if (!reply) return res.status(404).json({ success: false, error: 'Reply not found' });

  await prisma.$transaction([
    prisma.discussionReply.delete({ where: { id } }),
    prisma.discussion.update({ where: { id: reply.discussionId }, data: { replyCount: { decrement: 1 } } }),
  ]);
  res.json({ success: true });
}

export async function adminGetStats(_req: Request, res: Response) {
  const [total, pending, approved, closed, totalReplies] = await Promise.all([
    prisma.discussion.count(),
    prisma.discussion.count({ where: { status: 'PENDING' } }),
    prisma.discussion.count({ where: { status: 'APPROVED' } }),
    prisma.discussion.count({ where: { status: 'CLOSED' } }),
    prisma.discussionReply.count(),
  ]);
  res.json({ success: true, data: { total, pending, approved, closed, totalReplies } });
}

export async function adminGetSettings(_req: Request, res: Response) {
  const s = await prisma.communitySettings.findUnique({ where: { id: 'main' } });
  res.json({ success: true, data: s });
}

export async function adminUpdateSettings(req: Request, res: Response) {
  const { whatsappNumber, whatsappGroupLink, contactEmail, telegramLink, bannerText, bannerEnabled, requireModeration, allowAnonymous } = req.body;
  const s = await prisma.communitySettings.upsert({
    where: { id: 'main' },
    update: { whatsappNumber, whatsappGroupLink, contactEmail, telegramLink, bannerText, bannerEnabled, requireModeration, allowAnonymous },
    create: { id: 'main', whatsappNumber, whatsappGroupLink, contactEmail, telegramLink, bannerText, bannerEnabled, requireModeration, allowAnonymous },
  });
  res.json({ success: true, data: s });
}
