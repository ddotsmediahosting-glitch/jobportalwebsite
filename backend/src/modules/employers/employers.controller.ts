import { Request, Response } from 'express';
import { EmployersService } from './employers.service';
import { AuthRequest } from '../../middleware/auth';

const service = new EmployersService();

export class EmployersController {
  async getMyEmployer(req: AuthRequest, res: Response) {
    const data = await service.getMyEmployer(req.user!.sub);
    res.json({ success: true, data });
  }

  async getEmployerBySlug(req: Request, res: Response) {
    const data = await service.getEmployerBySlug(req.params.slug);
    res.json({ success: true, data });
  }

  async updateProfile(req: AuthRequest, res: Response) {
    const data = await service.updateProfile(req.user!.sub, req.body);
    res.json({ success: true, data });
  }

  async uploadLogo(req: AuthRequest, res: Response) {
    const file = req.file!;
    const data = await service.uploadLogo(req.user!.sub, file.buffer, file.originalname, file.mimetype);
    res.json({ success: true, data });
  }

  async uploadCover(req: AuthRequest, res: Response) {
    const file = req.file!;
    const data = await service.uploadCover(req.user!.sub, file.buffer, file.originalname, file.mimetype);
    res.json({ success: true, data });
  }

  async uploadTradeLicense(req: AuthRequest, res: Response) {
    const file = req.file!;
    const data = await service.uploadTradeLicense(req.user!.sub, file.buffer, file.originalname, file.mimetype);
    res.json({ success: true, data });
  }

  async getTeam(req: AuthRequest, res: Response) {
    const data = await service.getTeam(req.user!.sub);
    res.json({ success: true, data });
  }

  async inviteTeamMember(req: AuthRequest, res: Response) {
    const { email, role } = req.body;
    const data = await service.inviteTeamMember(req.user!.sub, email, role);
    res.status(201).json({ success: true, ...data });
  }

  async removeTeamMember(req: AuthRequest, res: Response) {
    const data = await service.removeTeamMember(req.user!.sub, req.params.memberId);
    res.json({ success: true, ...data });
  }

  async getAnalytics(req: AuthRequest, res: Response) {
    const data = await service.getAnalytics(req.user!.sub);
    res.json({ success: true, data });
  }
}
