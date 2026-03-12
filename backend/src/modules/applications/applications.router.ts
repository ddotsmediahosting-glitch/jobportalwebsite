import { Router } from 'express';
import { ApplicationsController } from './applications.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { applyJobSchema } from '@uaejobs/shared';
import { z } from 'zod';

const router = Router();
const ctrl = new ApplicationsController();

// Seeker: apply
router.post('/jobs/:jobId/apply', authenticate, requireRole('SEEKER'), validate(applyJobSchema), ctrl.apply.bind(ctrl));

// Employer: manage applications
const employer = Router();
employer.use(authenticate, requireRole('EMPLOYER', 'ADMIN', 'SUB_ADMIN'));

employer.get('/applications', ctrl.getEmployerApplications.bind(ctrl));
employer.get('/applications/:id', ctrl.getApplicationById.bind(ctrl));
employer.patch('/applications/:id/status', ctrl.updateStatus.bind(ctrl));
employer.patch('/applications/:id/notes', ctrl.updateNotes.bind(ctrl));
employer.get('/jobs/:jobId/applications', ctrl.getApplicationsByJob.bind(ctrl));
employer.get('/jobs/:jobId/kanban', ctrl.getKanban.bind(ctrl));

export { router as applicationSeekerRouter, employer as applicationEmployerRouter };
