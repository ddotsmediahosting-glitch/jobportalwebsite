import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthRequest } from '../../middleware/auth';

const service = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    const { email, password, role, firstName, lastName, companyName } = req.body;
    const result = await service.register(email, password, role, firstName, lastName, companyName);
    res.status(201).json({ success: true, data: result, message: 'Registration successful. Please verify your email.' });
  }

  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    const result = await service.login(email, password);
    res.json({ success: true, data: result });
  }

  async refresh(req: Request, res: Response) {
    const { refreshToken } = req.body;
    const result = await service.refresh(refreshToken);
    res.json({ success: true, data: result });
  }

  async logout(req: Request, res: Response) {
    const { refreshToken } = req.body;
    await service.logout(refreshToken);
    res.json({ success: true, message: 'Logged out' });
  }

  async verifyEmail(req: Request, res: Response) {
    const { email, otp } = req.body;
    const result = await service.verifyEmail(email, otp);
    res.json({ success: true, ...result });
  }

  async resendVerification(req: Request, res: Response) {
    const { email } = req.body;
    const result = await service.resendVerification(email);
    res.json({ success: true, ...result });
  }

  async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;
    const result = await service.forgotPassword(email);
    res.json({ success: true, ...result });
  }

  async resetPassword(req: Request, res: Response) {
    const { token, password } = req.body;
    const result = await service.resetPassword(token, password);
    res.json({ success: true, ...result });
  }

  async changePassword(req: AuthRequest, res: Response) {
    const { currentPassword, newPassword } = req.body;
    const result = await service.changePassword(req.user!.sub, currentPassword, newPassword);
    res.json({ success: true, ...result });
  }

  async me(req: AuthRequest, res: Response) {
    const { sub, email, role } = req.user!;
    res.json({ success: true, data: { id: sub, email, role } });
  }
}
