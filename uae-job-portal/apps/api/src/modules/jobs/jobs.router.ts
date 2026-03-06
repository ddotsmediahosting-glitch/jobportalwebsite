import { Router } from 'express';
import { JobsController } from './jobs.controller';
import { authenticate, requireRole, optionalAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { jobPostLimiter } from '../../middleware/rateLimiter';
import { createJobSchema, updateJobSchema, jobFiltersSchema, reportJobSchema } from './jobs.schema';

const router = Router();
const ctrl = new JobsController();

// ── Public ─────────────────────────────────────────────────────────────────────
router.get('/', validate(jobFiltersSchema, 'query'), ctrl.listPublicJobs.bind(ctrl));
router.get('/:slug', optionalAuth, ctrl.getJobBySlug.bind(ctrl));

// ── Seeker actions ─────────────────────────────────────────────────────────────
router.post('/:slug/report', authenticate, requireRole('SEEKER'), validate(reportJobSchema), ctrl.reportJob.bind(ctrl));

// ── Employer job management ────────────────────────────────────────────────────
const employerJobs = Router();
employerJobs.use(authenticate, requireRole('EMPLOYER', 'ADMIN', 'SUB_ADMIN'));

employerJobs.get('/', ctrl.getEmployerJobs.bind(ctrl));
employerJobs.post('/', jobPostLimiter, validate(createJobSchema), ctrl.createJob.bind(ctrl));
employerJobs.put('/:id', validate(updateJobSchema), ctrl.updateJob.bind(ctrl));
employerJobs.delete('/:id', ctrl.deleteJob.bind(ctrl));
employerJobs.post('/:id/publish', ctrl.publishJob.bind(ctrl));
employerJobs.post('/:id/pause', ctrl.pauseJob.bind(ctrl));
employerJobs.post('/:id/close', ctrl.closeJob.bind(ctrl));
employerJobs.post('/:id/clone', ctrl.cloneJob.bind(ctrl));

export { router as jobsRouter, employerJobs as employerJobsRouter };
