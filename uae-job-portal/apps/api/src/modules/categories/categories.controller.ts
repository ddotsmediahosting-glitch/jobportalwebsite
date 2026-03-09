import { Request, Response } from 'express';
import { CategoriesService } from './categories.service';
import { cacheGetOrSet, cacheDel } from '../../lib/cache';

const service = new CategoriesService();

const TREE_KEY = 'categories:tree:active';
const TREE_ALL_KEY = 'categories:tree:all';
const FEATURED_KEY = 'categories:featured';

export class CategoriesController {
  async getTree(req: Request, res: Response) {
    const all = req.query.all === 'true';
    const key = all ? TREE_ALL_KEY : TREE_KEY;
    const data = await cacheGetOrSet(key, () => service.getTree(!all), 120);
    res.json({ success: true, data });
  }

  async getFeatured(_req: Request, res: Response) {
    const data = await cacheGetOrSet(FEATURED_KEY, () => service.getFeatured(), 120);
    res.json({ success: true, data });
  }

  async getBySlug(req: Request, res: Response) {
    const data = await service.getBySlug(req.params.slug);
    res.json({ success: true, data });
  }

  async create(req: Request, res: Response) {
    const data = await service.create(req.body);
    await cacheDel(TREE_KEY, TREE_ALL_KEY, FEATURED_KEY);
    res.status(201).json({ success: true, data });
  }

  async update(req: Request, res: Response) {
    const data = await service.update(req.params.id, req.body);
    await cacheDel(TREE_KEY, TREE_ALL_KEY, FEATURED_KEY);
    res.json({ success: true, data });
  }

  async delete(req: Request, res: Response) {
    const data = await service.delete(req.params.id);
    await cacheDel(TREE_KEY, TREE_ALL_KEY, FEATURED_KEY);
    res.json({ success: true, ...data });
  }

  async reorder(req: Request, res: Response) {
    const data = await service.reorder(req.body.items);
    await cacheDel(TREE_KEY, TREE_ALL_KEY, FEATURED_KEY);
    res.json({ success: true, ...data });
  }
}
