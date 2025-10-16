import express from 'express';
import {
  createPayment,
  listAllPayments,
  getPaymentById,
  updatePayment,
  cancelPayment,
  processPayment,
} from '../../controllers/admin/payment.controller.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.post('/', authenticate, authorize('admin'), createPayment);
router.get('/', authenticate, authorize('admin'), listAllPayments);
router.get('/:id', authenticate, authorize('admin'), getPaymentById);
router.patch('/:id', authenticate, authorize('admin'), updatePayment);
router.patch('/:id/cancel', authenticate, authorize('admin'), cancelPayment);
router.post('/:id/process', authenticate, authorize('admin'), processPayment);

export default router;
