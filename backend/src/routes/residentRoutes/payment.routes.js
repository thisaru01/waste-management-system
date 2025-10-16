import express from 'express';
import {
  getMyPayments,
  getOutstandingBalance,
  getPaymentHistory,
  processPayment,
} from '../../controllers/residentController/payment.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.get('/', authenticate, getMyPayments);
router.get('/outstanding-balance', authenticate, getOutstandingBalance);
router.get('/history', authenticate, getPaymentHistory);
router.post('/:id/pay', authenticate, processPayment);

export default router;
