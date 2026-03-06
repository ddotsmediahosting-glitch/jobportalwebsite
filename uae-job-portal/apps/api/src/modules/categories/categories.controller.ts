import { Request, Response } from 'express';
import { CategoriesService } from './categories.service';

const service = new CategoriesService();

export class CategoriesController {
  async getTree(req: Request, res: Response) {
    const data = await service.getTree(req.query.all !== 'true');
    res.json({ success: true, data });
  }

  async getFeatured(_req: Request, res: Response) {
    const data = await service.getFeatured();
    res.json({ success: true, data });
  }

  async getBySlug(req: Request, res: Response) {
    const data = await service.getBySlug(req.params.slug);
    res.json({ success: true, data });
  }

  async create(req: Request, res: Response) {
    const data = await service.create(req.body);
    res.status(201).json({ success: true, data });
  }

  async update(req: Request, res: Response) {
    const data = await service.update(req.params.id, req.body);
    res.json({ success: true, data });
  }

  async delete(req: Request, res: Response) {
    const data = await service.delete(req.params.id);
    res.json({ success: true, ...data });
  }

  async reorder(req: Request, res: Response) {
    const data = await service.reorder(req.body.items);
    res.json({ success: true, ...data });
  }
}
