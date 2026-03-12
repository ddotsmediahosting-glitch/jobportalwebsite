import { Router } from 'express';
import { CategoriesController } from './categories.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { categorySchema } from '@uaejobs/shared';

const router = Router();
const ctrl = new CategoriesController();

// Public
router.get('/', ctrl.getTree.bind(ctrl));
router.get('/featured', ctrl.getFeatured.bind(ctrl));
router.get('/:slug', ctrl.getBySlug.bind(ctrl));

// Admin only
router.post('/', authenticate, requireRole('ADMIN', 'SUB_ADMIN'), validate(categorySchema), ctrl.create.bind(ctrl));
router.put('/:id', authenticate, requireRole('ADMIN', 'SUB_ADMIN'), validate(categorySchema.partial()), ctrl.update.bind(ctrl));
router.delete('/:id', authenticate, requireRole('ADMIN', 'SUB_ADMIN'), ctrl.delete.bind(ctrl));
router.post('/reorder', authenticate, requireRole('ADMIN', 'SUB_ADMIN'), ctrl.reorder.bind(ctrl));

export default router;
