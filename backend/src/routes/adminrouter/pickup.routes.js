import express from 'express';
import {
  listAllPickups,
  updatePickupStatus,
  getPickupById,
} from '../../controllers/admin/pickup.controller.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.get('/', authenticate, authorize('admin'), listAllPickups);
router.get('/:id', authenticate, authorize('admin'), getPickupById);
router.patch('/:id/status', authenticate, authorize('admin'), updatePickupStatus);

export default router;
