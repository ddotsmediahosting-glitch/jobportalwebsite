import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import * as ctrl from './whatsapp-links.controller';

export const whatsappLinksPublicRouter = Router();
export const whatsappLinksAdminRouter = Router();

// ── Public ─────────────────────────────────────────────────────────────────────
whatsappLinksPublicRouter.get('/whatsapp-links', ctrl.getPublicPage);
whatsappLinksPublicRouter.post('/whatsapp-links/:id/click', ctrl.trackClick);

// ── Admin ──────────────────────────────────────────────────────────────────────
whatsappLinksAdminRouter.use(authenticate, requireRole('ADMIN', 'SUB_ADMIN'));
whatsappLinksAdminRouter.get('/whatsapp-links/groups', ctrl.adminListGroups);
whatsappLinksAdminRouter.post('/whatsapp-links/groups', ctrl.adminCreateGroup);
whatsappLinksAdminRouter.put('/whatsapp-links/groups/:id', ctrl.adminUpdateGroup);
whatsappLinksAdminRouter.delete('/whatsapp-links/groups/:id', ctrl.adminDeleteGroup);
whatsappLinksAdminRouter.get('/whatsapp-links/page', ctrl.adminGetPageSettings);
whatsappLinksAdminRouter.put('/whatsapp-links/page', ctrl.adminUpdatePageSettings);
