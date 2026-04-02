import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest, requireRole } from '../../middleware/auth';
import prisma from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import slugify from 'slugify';

const router = Router();

// ── Public Blog Endpoints ──────────────────────────────────────────────────────

router.get('/blog', async (req: Request, res: Response) => {
  const { page = '1', limit = '12', category, tag, q } = req.query as Record<string, string>;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = Math.min(parseInt(limit), 50);

  const where: Record<string, unknown> = { isPublished: true };
  if (category) where.category = category;
  if (tag) where.tags = { array_contains: tag };
  if (q) where.title = { contains: q };

  const [items, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip,
      take,
      select: {
        id: true, slug: true, title: true, excerpt: true, coverImage: true,
        author: true, category: true, tags: true, readTime: true,
        viewCount: true, publishedAt: true, createdAt: true,
      },
    }),
    prisma.blogPost.count({ where }),
  ]);

  res.json({ success: true, data: { items, total, page: parseInt(page), limit: take, totalPages: Math.ceil(total / take) } });
});

router.get('/blog/categories', async (_req: Request, res: Response) => {
  const cats = await prisma.blogPost.groupBy({
    by: ['category'],
    where: { isPublished: true },
    _count: { _all: true },
    orderBy: { _count: { category: 'desc' } },
  });
  res.json({ success: true, data: cats.map(c => ({ name: c.category, count: c._count._all })) });
});

router.get('/blog/:slug', async (req: Request, res: Response) => {
  const post = await prisma.blogPost.findFirst({
    where: { slug: req.params.slug, isPublished: true },
  });
  if (!post) { res.status(404).json({ success: false, error: 'Post not found' }); return; }

  await prisma.blogPost.update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } });
  res.json({ success: true, data: post });
});

// ── Public Useful Links ────────────────────────────────────────────────────────

router.get('/useful-links', async (_req: Request, res: Response) => {
  const links = await prisma.usefulLink.findMany({
    where: { isActive: true },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { title: 'asc' }],
  });
  // Group by category
  const grouped: Record<string, typeof links> = {};
  for (const link of links) {
    if (!grouped[link.category]) grouped[link.category] = [];
    grouped[link.category].push(link);
  }
  res.json({ success: true, data: { links, grouped } });
});

// ── Admin Blog CRUD ────────────────────────────────────────────────────────────

const admin = Router();
admin.use(authenticate, requireRole('ADMIN', 'SUB_ADMIN'));

admin.get('/blog', async (_req: AuthRequest, res: Response) => {
  const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ success: true, data: posts });
});

admin.post('/blog', async (req: AuthRequest, res: Response) => {
  const { title, excerpt, content, coverImage, author, category, tags, isPublished, readTime } = req.body;
  if (!title || !content) { res.status(400).json({ success: false, error: 'title and content are required' }); return; }

  const baseSlug = slugify(title, { lower: true, strict: true });
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  const post = await prisma.blogPost.create({
    data: {
      title, slug, excerpt: excerpt || null, content,
      coverImage: coverImage || null,
      author: author || 'Admin',
      category: category || 'General',
      tags: Array.isArray(tags) ? tags : [],
      isPublished: !!isPublished,
      publishedAt: isPublished ? new Date() : null,
      readTime: readTime ? parseInt(readTime) : Math.ceil(content.split(' ').length / 200),
    },
  });
  res.status(201).json({ success: true, data: post });
});

admin.put('/blog/:id', async (req: AuthRequest, res: Response) => {
  const { title, excerpt, content, coverImage, author, category, tags, isPublished, readTime } = req.body;
  const existing = await prisma.blogPost.findUnique({ where: { id: req.params.id } });
  if (!existing) { res.status(404).json({ success: false, error: 'Post not found' }); return; }

  const post = await prisma.blogPost.update({
    where: { id: req.params.id },
    data: {
      title: title || existing.title,
      excerpt: excerpt ?? existing.excerpt,
      content: content || existing.content,
      coverImage: coverImage ?? existing.coverImage,
      author: author || existing.author,
      category: category || existing.category,
      tags: Array.isArray(tags) ? tags : (existing.tags ?? []),
      isPublished: isPublished !== undefined ? !!isPublished : existing.isPublished,
      publishedAt: isPublished && !existing.publishedAt ? new Date() : existing.publishedAt,
      readTime: readTime ? parseInt(readTime) : existing.readTime,
    },
  });
  res.json({ success: true, data: post });
});

admin.delete('/blog/:id', async (req: AuthRequest, res: Response) => {
  await prisma.blogPost.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Post deleted' });
});

// ── Admin Useful Links CRUD ────────────────────────────────────────────────────

admin.get('/useful-links', async (_req: AuthRequest, res: Response) => {
  const links = await prisma.usefulLink.findMany({ orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }] });
  res.json({ success: true, data: links });
});

admin.post('/useful-links', async (req: AuthRequest, res: Response) => {
  const { title, url, description, category, iconUrl, isActive, sortOrder } = req.body;
  if (!title || !url) { res.status(400).json({ success: false, error: 'title and url are required' }); return; }

  const link = await prisma.usefulLink.create({
    data: {
      title, url, description: description || null,
      category: category || 'General',
      iconUrl: iconUrl || null,
      isActive: isActive !== undefined ? !!isActive : true,
      sortOrder: sortOrder ? parseInt(sortOrder) : 0,
    },
  });
  res.status(201).json({ success: true, data: link });
});

admin.put('/useful-links/:id', async (req: AuthRequest, res: Response) => {
  const { title, url, description, category, iconUrl, isActive, sortOrder } = req.body;
  const link = await prisma.usefulLink.update({
    where: { id: req.params.id },
    data: {
      ...(title && { title }), ...(url && { url }),
      ...(description !== undefined && { description }),
      ...(category && { category }),
      ...(iconUrl !== undefined && { iconUrl }),
      ...(isActive !== undefined && { isActive: !!isActive }),
      ...(sortOrder !== undefined && { sortOrder: parseInt(sortOrder) }),
    },
  });
  res.json({ success: true, data: link });
});

admin.delete('/useful-links/:id', async (req: AuthRequest, res: Response) => {
  await prisma.usefulLink.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Link deleted' });
});

export { router as contentPublicRouter, admin as contentAdminRouter };
