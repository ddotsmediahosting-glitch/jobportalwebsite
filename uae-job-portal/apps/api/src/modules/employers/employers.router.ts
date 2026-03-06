import { Router } from 'express';
import { EmployersController } from './employers.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { imageUpload, documentUpload, uploadLimiter } from '../../middleware/upload';
import { employerProfileSchema } from '@uaejobs/shared';

const router = Router();
const ctrl = new EmployersController();

// Public: get employer by slug
router.get('/employers/:slug', ctrl.getEmployerBySlug.bind(ctrl));

// Protected employer routes
const employer = Router();
employer.use(authenticate, requireRole('EMPLOYER', 'ADMIN', 'SUB_ADMIN'));

employer.get('/me', ctrl.getMyEmployer.bind(ctrl));
employer.put('/profile', validate(employerProfileSchema), ctrl.updateProfile.bind(ctrl));
employer.post('/upload/logo', uploadLimiter, imageUpload.single('logo'), ctrl.uploadLogo.bind(ctrl));
employer.post('/upload/cover', uploadLimiter, imageUpload.single('cover'), ctrl.uploadCover.bind(ctrl));
employer.post('/upload/license', uploadLimiter, documentUpload.single('license'), ctrl.uploadTradeLicense.bind(ctrl));
employer.get('/team', ctrl.getTeam.bind(ctrl));
employer.post('/team/invite', ctrl.inviteTeamMember.bind(ctrl));
employer.delete('/team/:memberId', ctrl.removeTeamMember.bind(ctrl));
employer.get('/analytics', ctrl.getAnalytics.bind(ctrl));

export { router as publicEmployerRouter, employer as employerRouter };
