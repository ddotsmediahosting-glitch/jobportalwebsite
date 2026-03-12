import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { resumeUpload, imageUpload, uploadLimiter } from '../../middleware/upload';
import { seekerProfileSchema } from '@uaejobs/shared';

const router = Router();
const ctrl = new UsersController();

router.use(authenticate);
router.use(requireRole('SEEKER'));

// Profile
router.get('/profile', ctrl.getProfile.bind(ctrl));
router.put('/profile', validate(seekerProfileSchema), ctrl.updateProfile.bind(ctrl));
router.post('/profile/avatar', uploadLimiter, imageUpload.single('avatar'), ctrl.uploadAvatar.bind(ctrl));

// Resumes
router.post('/resumes', uploadLimiter, resumeUpload.single('resume'), ctrl.uploadResume.bind(ctrl));
router.delete('/resumes/:resumeId', ctrl.deleteResume.bind(ctrl));
router.patch('/resumes/:resumeId/primary', ctrl.setPrimaryResume.bind(ctrl));

// Saved jobs
router.get('/saved-jobs', ctrl.getSavedJobs.bind(ctrl));
router.post('/saved-jobs/:jobId', ctrl.saveJob.bind(ctrl));
router.delete('/saved-jobs/:jobId', ctrl.unsaveJob.bind(ctrl));

// Applications
router.get('/applications', ctrl.getMyApplications.bind(ctrl));

// Job alerts
router.get('/alerts', ctrl.getJobAlerts.bind(ctrl));
router.post('/alerts', ctrl.createJobAlert.bind(ctrl));
router.delete('/alerts/:alertId', ctrl.deleteJobAlert.bind(ctrl));

// Account
router.delete('/account', ctrl.deleteAccount.bind(ctrl));

export default router;
