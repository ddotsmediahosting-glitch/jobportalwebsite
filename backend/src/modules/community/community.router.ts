import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/auth';
import * as c from './community.controller';

// ── Public routes ────────────────────────────────────────────────────────────
export const communityPublicRouter = Router();

communityPublicRouter.get('/community', c.listDiscussions);
communityPublicRouter.get('/community/settings', c.getPublicSettings);
communityPublicRouter.get('/community/:id', c.getDiscussion);
communityPublicRouter.post('/community', c.createDiscussion);
communityPublicRouter.post('/community/:id/replies', c.createReply);
communityPublicRouter.post('/community/:id/vote', c.voteDiscussion);
communityPublicRouter.post('/community/replies/:id/vote', c.voteReply);

// ── Admin routes ─────────────────────────────────────────────────────────────
export const communityAdminRouter = Router();
communityAdminRouter.use(authenticate, requireRole('ADMIN', 'SUB_ADMIN'));

communityAdminRouter.get('/community/stats', c.adminGetStats);
communityAdminRouter.get('/community/settings', c.adminGetSettings);
communityAdminRouter.put('/community/settings', c.adminUpdateSettings);
communityAdminRouter.get('/community', c.adminListDiscussions);
communityAdminRouter.get('/community/:id', c.adminGetDiscussion);
communityAdminRouter.patch('/community/:id', c.adminUpdateDiscussion);
communityAdminRouter.delete('/community/:id', c.adminDeleteDiscussion);
communityAdminRouter.post('/community/replies/:id/accept', c.adminAcceptReply);
communityAdminRouter.delete('/community/replies/:id', c.adminDeleteReply);
