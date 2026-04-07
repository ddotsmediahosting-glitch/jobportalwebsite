import { Router } from 'express';
import { AdminController } from './admin.controller';
import { MarketingController } from '../marketing/marketing.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();
const ctrl = new AdminController();
const mktCtrl = new MarketingController();

// All admin routes require ADMIN or SUB_ADMIN role
router.use(authenticate, requireRole('ADMIN', 'SUB_ADMIN'));

// Dashboard & Analytics
router.get('/stats', ctrl.getStats.bind(ctrl));
router.get('/analytics', ctrl.getAnalytics.bind(ctrl));

// Users
router.post('/users/sub-admin', ctrl.createSubAdmin.bind(ctrl));
router.get('/users', ctrl.listUsers.bind(ctrl));
router.get('/users/export', ctrl.exportUsers.bind(ctrl));
router.post('/users/bulk-status', ctrl.bulkUpdateUserStatus.bind(ctrl));
router.get('/users/:id', ctrl.getUserDetail.bind(ctrl));
router.patch('/users/:id/status', ctrl.updateUserStatus.bind(ctrl));
router.patch('/users/:id/profile', ctrl.updateUserProfile.bind(ctrl));
router.post('/users/:id/reset-password', ctrl.resetUserPassword.bind(ctrl));
router.delete('/users/:id', ctrl.deleteUser.bind(ctrl));

// Employers
router.get('/employers', ctrl.listEmployers.bind(ctrl));
router.post('/employers', ctrl.createEmployer.bind(ctrl));
router.patch('/employers/:id/verify', ctrl.verifyEmployer.bind(ctrl));
router.patch('/employers/:id', ctrl.updateEmployer.bind(ctrl));

// Jobs
router.get('/jobs', ctrl.listJobs.bind(ctrl));
router.post('/jobs', ctrl.createJob.bind(ctrl));
router.post('/jobs/bulk-moderate', ctrl.bulkModerateJobs.bind(ctrl));
router.patch('/jobs/:id/moderate', ctrl.moderateJob.bind(ctrl));
router.patch('/jobs/:id/feature', ctrl.toggleJobFeatured.bind(ctrl));
router.patch('/jobs/:id', ctrl.updateJob.bind(ctrl));
router.delete('/jobs/:id', ctrl.deleteJob.bind(ctrl));

// Reports
router.get('/reports', ctrl.listReports.bind(ctrl));
router.patch('/reports/:id/resolve', ctrl.resolveReport.bind(ctrl));

// Audit logs
router.get('/audit-logs', ctrl.listAuditLogs.bind(ctrl));

// Settings
router.get('/settings', ctrl.getSettings.bind(ctrl));
router.put('/settings/:key', ctrl.updateSetting.bind(ctrl));

// SMTP test
router.post('/test-email', ctrl.testEmail.bind(ctrl));

// Content pages (CMS)
router.get('/pages', ctrl.listContentPages.bind(ctrl));
router.get('/pages/:slug', ctrl.getContentPage.bind(ctrl));
router.put('/pages', ctrl.upsertContentPage.bind(ctrl));
router.delete('/pages/:slug', ctrl.deleteContentPage.bind(ctrl));

// Subscriptions
router.get('/subscriptions', ctrl.listSubscriptions.bind(ctrl));
router.patch('/subscriptions/:employerId', ctrl.overrideSubscription.bind(ctrl));

// Marketing & SEO analytics
router.get('/marketing', mktCtrl.getAdminStats.bind(mktCtrl));

export default router;
