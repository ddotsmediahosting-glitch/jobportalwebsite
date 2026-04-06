import prisma from '../../lib/prisma';
import { NotFoundError, ConflictError } from '../../middleware/errorHandler';
import { CategoryInput } from '@uaejobs/shared';
import { cacheGetOrSet, cacheDel } from '../../lib/cache';

export class CategoriesService {
  async getTree(activeOnly = true) {
    const buildTree = async () => {
      const all = await prisma.category.findMany({
        where: activeOnly ? { isActive: true } : undefined,
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { jobs: { where: { status: 'PUBLISHED' } } } } },
      });

      const map = new Map<string, typeof all[0] & { children: typeof all }>();
      const roots: (typeof all[0] & { children: typeof all })[] = [];

      for (const cat of all) {
        map.set(cat.id, { ...cat, children: [] });
      }

      for (const cat of all) {
        const node = map.get(cat.id)!;
        if (cat.parentId) {
          const parent = map.get(cat.parentId);
          if (parent) parent.children.push(node);
        } else {
          roots.push(node);
        }
      }

      return roots;
    };

    return cacheGetOrSet(`categories:tree:${activeOnly}`, buildTree, 600); // 10 min
  }

  async getBySlug(slug: string) {
    const cat = await prisma.category.findUnique({
      where: { slug },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: { _count: { select: { jobs: { where: { status: 'PUBLISHED' } } } } },
        },
        parent: true,
        _count: { select: { jobs: { where: { status: 'PUBLISHED' } } } },
      },
    });

    if (!cat) throw new NotFoundError('Category');
    return cat;
  }

  private async invalidateCategoryCache() {
    await cacheDel('categories:tree:true', 'categories:tree:false', 'categories:featured');
  }

  async create(data: CategoryInput) {
    const existing = await prisma.category.findUnique({ where: { slug: data.slug } });
    if (existing) throw new ConflictError('Slug already in use');

    const result = await prisma.category.create({ data });
    await this.invalidateCategoryCache();
    return result;
  }

  async update(id: string, data: Partial<CategoryInput>) {
    const cat = await prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundError('Category');

    if (data.slug && data.slug !== cat.slug) {
      const existing = await prisma.category.findUnique({ where: { slug: data.slug } });
      if (existing) throw new ConflictError('Slug already in use');
    }

    const result = await prisma.category.update({ where: { id }, data });
    await this.invalidateCategoryCache();
    return result;
  }

  async delete(id: string) {
    const cat = await prisma.category.findUnique({ where: { id }, include: { children: true, _count: { select: { jobs: true } } } });
    if (!cat) throw new NotFoundError('Category');

    if ((cat._count as { jobs: number }).jobs > 0) {
      throw new ConflictError('Cannot delete category with existing jobs');
    }

    if (cat.children.length > 0) {
      throw new ConflictError('Cannot delete category with subcategories');
    }

    await prisma.category.delete({ where: { id } });
    await this.invalidateCategoryCache();
    return { message: 'Category deleted' };
  }

  async reorder(items: { id: string; sortOrder: number }[]) {
    await Promise.all(
      items.map(({ id, sortOrder }) => prisma.category.update({ where: { id }, data: { sortOrder } }))
    );
    await this.invalidateCategoryCache();
    return { message: 'Order updated' };
  }

  async getFeatured() {
    return cacheGetOrSet('categories:featured', () => prisma.category.findMany({
      where: { isFeatured: true, isActive: true, parentId: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { jobs: { where: { status: 'PUBLISHED' } } } },
        children: {
          where: { isActive: true },
          take: 6,
          orderBy: { sortOrder: 'asc' },
        },
      },
    }), 600); // 10 min
  }
}
