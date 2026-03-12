import { Request, Response } from 'express';
import prisma from '../../lib/prisma';

// ── Public ─────────────────────────────────────────────────────────────────────

export async function getPublicPage(_req: Request, res: Response) {
  const [page, groups] = await Promise.all([
    prisma.whatsAppLinksPage.findUnique({ where: { id: 'main' } }),
    prisma.whatsAppGroup.findMany({
      where: { isActive: true },
      orderBy: [{ isPinned: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    }),
  ]);
  res.json({ success: true, data: { page, groups } });
}

export async function trackClick(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.whatsAppGroup.update({
    where: { id },
    data: { clickCount: { increment: 1 } },
  });
  res.json({ success: true });
}

// ── Admin ──────────────────────────────────────────────────────────────────────

export async function adminListGroups(_req: Request, res: Response) {
  const groups = await prisma.whatsAppGroup.findMany({
    orderBy: [{ isPinned: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
  });
  res.json({ success: true, data: groups });
}

export async function adminCreateGroup(req: Request, res: Response) {
  const { title, description, link, category, emoji, memberCount, maxMembers, isPinned, isActive, sortOrder, tags } = req.body;
  const group = await prisma.whatsAppGroup.create({
    data: { title, description, link, category, emoji, memberCount: memberCount ? Number(memberCount) : null, maxMembers: maxMembers ? Number(maxMembers) : null, isPinned: Boolean(isPinned), isActive: isActive !== false, sortOrder: Number(sortOrder ?? 0), tags: tags ?? [] },
  });
  res.status(201).json({ success: true, data: group });
}

export async function adminUpdateGroup(req: Request, res: Response) {
  const { id } = req.params;
  const { title, description, link, category, emoji, memberCount, maxMembers, isPinned, isActive, sortOrder, tags } = req.body;
  const group = await prisma.whatsAppGroup.update({
    where: { id },
    data: { title, description, link, category, emoji, memberCount: memberCount !== undefined ? (memberCount ? Number(memberCount) : null) : undefined, maxMembers: maxMembers !== undefined ? (maxMembers ? Number(maxMembers) : null) : undefined, isPinned: isPinned !== undefined ? Boolean(isPinned) : undefined, isActive: isActive !== undefined ? Boolean(isActive) : undefined, sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined, tags: tags ?? undefined },
  });
  res.json({ success: true, data: group });
}

export async function adminDeleteGroup(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.whatsAppGroup.delete({ where: { id } });
  res.json({ success: true });
}

export async function adminGetPageSettings(_req: Request, res: Response) {
  let page = await prisma.whatsAppLinksPage.findUnique({ where: { id: 'main' } });
  if (!page) {
    page = await prisma.whatsAppLinksPage.create({ data: { id: 'main', updatedAt: new Date() } });
  }
  res.json({ success: true, data: page });
}

export async function adminUpdatePageSettings(req: Request, res: Response) {
  const { name, tagline, bio, avatarUrl, bannerText, bannerColor, theme, socialLinks, isPublished, showStats } = req.body;
  const page = await prisma.whatsAppLinksPage.upsert({
    where: { id: 'main' },
    create: { id: 'main', name, tagline, bio, avatarUrl, bannerText, bannerColor, theme, socialLinks, isPublished, showStats, updatedAt: new Date() },
    update: { name, tagline, bio, avatarUrl, bannerText, bannerColor, theme, socialLinks, isPublished, showStats, updatedAt: new Date() },
  });
  res.json({ success: true, data: page });
}
