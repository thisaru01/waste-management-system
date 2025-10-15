import { Router } from 'express';
import { createRole, listRoles } from '../controllers/role.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', authenticate, authorize('admin'), listRoles);
router.post('/', authenticate, authorize('admin'), createRole);

export default router;
