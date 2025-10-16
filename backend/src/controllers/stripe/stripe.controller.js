import stripeService from '../../services/stripe.service.js';
import paymentService from '../../services/payment.service.js';

/**
 * Stripe Webhook Controller
 * Handles Stripe webhook events
 * Follows Single Responsibility Principle - only handles Stripe webhooks
 */

/**
 * Handle Stripe webhook events
 * @route POST /api/webhooks/stripe
 */
export const handleStripeWebhook = async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const rawBody = req.rawBody; // Raw body is needed for signature verification

    if (!signature) {
      return res.status(400).json({
        message: 'Missing stripe-signature header',
        error: 'BadRequest',
      });
    }

    // Construct and verify the webhook event
    const event = stripeService.constructWebhookEvent(rawBody, signature);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return 200 to acknowledge receipt of the event
    return res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).json({
      message: err.message,
      error: 'WebhookError',
    });
  }
};

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    const chargeId = paymentIntent.charges?.data?.[0]?.id || null;
    await paymentService.handleStripePaymentSuccess(paymentIntent.id, {
      chargeId,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
    });
    console.log(`Payment succeeded: ${paymentIntent.id}`);
  } catch (error) {
    console.error('Error handling payment success:', error.message);
  }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent) {
  try {
    console.log(`Payment failed: ${paymentIntent.id}`, {
      reason: paymentIntent.last_payment_error?.message,
    });
    // Optionally, update payment status or notify user
  } catch (error) {
    console.error('Error handling payment failure:', error.message);
  }
}

/**
 * Handle canceled payment intent
 */
async function handlePaymentIntentCanceled(paymentIntent) {
  try {
    console.log(`Payment canceled: ${paymentIntent.id}`, {
      reason: paymentIntent.cancellation_reason,
    });
    // Optionally, update payment status
  } catch (error) {
    console.error('Error handling payment cancellation:', error.message);
  }
}

/**
 * Handle charge refunded
 */
async function handleChargeRefunded(charge) {
  try {
    console.log(`Charge refunded: ${charge.id}`, {
      amount: charge.amount_refunded / 100,
      refunded: charge.refunded,
    });
    // Payment refund is already handled in the service when initiated
    // This webhook confirms the refund was processed
  } catch (error) {
    console.error('Error handling charge refund:', error.message);
  }
}

/**
 * Get Stripe publishable key
 * @route GET /api/stripe/config
 */
export const getStripeConfig = async (req, res) => {
  try {
    return res.json({
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      message: err.message,
      error: err.name,
    });
  }
};
