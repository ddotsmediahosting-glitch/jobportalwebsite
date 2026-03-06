import { Response } from 'express';
import { ApplicationsService } from './applications.service';
import { AuthRequest } from '../../middleware/auth';
import { ApplicationStatus } from '@prisma/client';

const service = new ApplicationsService();

export class ApplicationsController {
  async apply(req: AuthRequest, res: Response) {
    const data = await service.apply(req.user!.sub, req.params.jobId, req.body);
    res.status(201).json({ success: true, data });
  }

  async getApplicationsByJob(req: AuthRequest, res: Response) {
    const { page, limit, status } = req.query as { page?: string; limit?: string; status?: string };
    const data = await service.getApplicationsByJob(
      req.user!.sub,
      req.params.jobId,
      Number(page) || 1,
      Number(limit) || 20,
      status as ApplicationStatus | undefined
    );
    res.json({ success: true, data });
  }

  async getEmployerApplications(req: AuthRequest, res: Response) {
    const { page, limit, status } = req.query as { page?: string; limit?: string; status?: string };
    const data = await service.getEmployerApplications(
      req.user!.sub,
      Number(page) || 1,
      Number(limit) || 20,
      status as ApplicationStatus | undefined
    );
    res.json({ success: true, data });
  }

  async getApplicationById(req: AuthRequest, res: Response) {
    const data = await service.getApplicationById(req.user!.sub, req.params.id);
    res.json({ success: true, data });
  }

  async updateStatus(req: AuthRequest, res: Response) {
    const { status, notes, rating, interviewDate } = req.body;
    const data = await service.updateApplicationStatus(
      req.user!.sub,
      req.params.id,
      status as ApplicationStatus,
      notes,
      rating,
      interviewDate ? new Date(interviewDate) : undefined
    );
    res.json({ success: true, data });
  }

  async updateNotes(req: AuthRequest, res: Response) {
    const { notes, tags, rating } = req.body;
    const data = await service.updateApplicationNotes(req.user!.sub, req.params.id, notes, tags, rating);
    res.json({ success: true, data });
  }

  async getKanban(req: AuthRequest, res: Response) {
    const data = await service.getKanbanBoard(req.user!.sub, req.params.jobId);
    res.json({ success: true, data });
  }
}
