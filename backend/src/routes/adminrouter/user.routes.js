import { Router } from 'express';
import { createUser, listUsers } from '../../controllers/admin/user.controller.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

// Only admin can manage users
router.post('/', authenticate, authorize('admin'), createUser);
router.get('/', authenticate, authorize('admin', 'authority'), listUsers);

export default router;
