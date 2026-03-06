import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();
const ctrl = new AdminController();

// All admin routes require ADMIN or SUB_ADMIN role
router.use(authenticate, requireRole('ADMIN', 'SUB_ADMIN'));

// Dashboard
router.get('/stats', ctrl.getStats.bind(ctrl));

// Users
router.get('/users', ctrl.listUsers.bind(ctrl));
router.get('/users/:id', ctrl.getUserDetail.bind(ctrl));
router.patch('/users/:id/status', ctrl.updateUserStatus.bind(ctrl));
router.post('/users/:id/reset-password', ctrl.resetUserPassword.bind(ctrl));
router.delete('/users/:id', ctrl.deleteUser.bind(ctrl));

// Employers
router.get('/employers', ctrl.listEmployers.bind(ctrl));
router.patch('/employers/:id/verify', ctrl.verifyEmployer.bind(ctrl));

// Jobs
router.get('/jobs', ctrl.listJobs.bind(ctrl));
router.patch('/jobs/:id/moderate', ctrl.moderateJob.bind(ctrl));

// Reports
router.get('/reports', ctrl.listReports.bind(ctrl));
router.patch('/reports/:id/resolve', ctrl.resolveReport.bind(ctrl));

// Audit logs
router.get('/audit-logs', ctrl.listAuditLogs.bind(ctrl));

// Settings
router.get('/settings', ctrl.getSettings.bind(ctrl));
router.put('/settings/:key', ctrl.updateSetting.bind(ctrl));

// Content pages (CMS)
router.get('/pages', ctrl.listContentPages.bind(ctrl));
router.get('/pages/:slug', ctrl.getContentPage.bind(ctrl));
router.put('/pages', ctrl.upsertContentPage.bind(ctrl));

// Subscriptions
router.get('/subscriptions', ctrl.listSubscriptions.bind(ctrl));
router.patch('/subscriptions/:employerId', ctrl.overrideSubscription.bind(ctrl));

export default router;
