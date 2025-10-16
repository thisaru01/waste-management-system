import express from 'express';
import {
  schedulePickup,
  getMyPickups,
  updateMyPickup,
  cancelMyPickup,
} from '../../controllers/residentController/pickup.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.post('/', authenticate, schedulePickup);
router.get('/', authenticate, getMyPickups);
router.patch('/:id', authenticate, updateMyPickup);
router.patch('/:id/cancel', authenticate, cancelMyPickup);

export default router;
