import express from 'express';
import {
  getMyPayments,
  getOutstandingBalance,
  getPaymentHistory,
  processPayment,
  createPaymentIntent,
  getPaymentByPickup,
} from '../../controllers/residentController/payment.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.get('/', authenticate, getMyPayments);
router.get('/outstanding-balance', authenticate, getOutstandingBalance);
router.get('/history', authenticate, getPaymentHistory);
router.get('/pickup/:pickupId', authenticate, getPaymentByPickup);
router.post('/:id/pay', authenticate, processPayment);
router.post('/:id/stripe/payment-intent', authenticate, createPaymentIntent);

export default router;
