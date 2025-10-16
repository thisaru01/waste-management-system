import express from 'express';
import { handleStripeWebhook, getStripeConfig } from '../../controllers/stripe/stripe.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Stripe Configuration Route
 * Returns the publishable key for client-side Stripe integration
 */
router.get('/config', authenticate, getStripeConfig);

/**
 * Stripe Webhook Route
 * IMPORTANT: Raw body handling is configured in app.js
 * The raw body is needed for Stripe signature verification
 */
router.post('/webhook', handleStripeWebhook);

export default router;
