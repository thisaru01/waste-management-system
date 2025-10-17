import Stripe from 'stripe';
import { BusinessRuleError } from '../utils/errors.js';

/**
 * Stripe Service
 * Handles all Stripe payment operations
 * Follows Single Responsibility Principle - only Stripe integration logic
 * Follows Dependency Inversion - provides abstraction for payment processing
 */
export class StripeService {
  constructor() {
    this.stripe = null;
  }

  /**
   * Initialize Stripe instance (lazy loading)
   * @private
   */
  _getStripe() {
    if (!this.stripe) {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY is not configured');
      }
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
    return this.stripe;
  }

  /**
   * Create a payment intent for a payment
   * @param {Object} params - Payment parameters
   * @param {number} params.amount - Amount in dollars
   * @param {string} params.currency - Currency code (default: 'usd')
   * @param {string} params.description - Payment description
   * @param {Object} params.metadata - Additional metadata
   * @returns {Promise<Object>} Payment intent object
   */
  async createPaymentIntent({ amount, currency = 'usd', description, metadata = {} }) {
    try {
      // Convert amount to cents (Stripe uses smallest currency unit)
      const amountInCents = Math.round(amount * 100);

      const stripe = this._getStripe();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency,
        description,
        metadata,
        payment_method_types: ['card'], // Only allow card payments
      });

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      };
    } catch (error) {
      throw new BusinessRuleError(`Failed to create payment intent: ${error.message}`);
    }
  }

  /**
   * Retrieve a payment intent
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Promise<Object>} Payment intent details
   */
  async retrievePaymentIntent(paymentIntentId) {
    try {
      const stripe = this._getStripe();
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert back to dollars
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        paymentMethod: paymentIntent.payment_method,
        charges: paymentIntent.charges?.data?.[0]?.id || null,
      };
    } catch (error) {
      throw new BusinessRuleError(`Failed to retrieve payment intent: ${error.message}`);
    }
  }

  /**
   * Cancel a payment intent
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Promise<Object>} Cancelled payment intent
   */
  async cancelPaymentIntent(paymentIntentId) {
    try {
      const stripe = this._getStripe();
      const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        cancellationReason: paymentIntent.cancellation_reason,
      };
    } catch (error) {
      throw new BusinessRuleError(`Failed to cancel payment intent: ${error.message}`);
    }
  }

  /**
   * Create a refund for a charge
   * @param {Object} params - Refund parameters
   * @param {string} params.paymentIntentId - Payment intent ID
   * @param {number} params.amount - Amount to refund in dollars (optional, full refund if not provided)
   * @param {string} params.reason - Refund reason
   * @returns {Promise<Object>} Refund object
   */
  async createRefund({ paymentIntentId, amount = null, reason = 'requested_by_customer' }) {
    try {
      const refundParams = {
        payment_intent: paymentIntentId,
        reason,
      };

      // If partial refund, specify amount in cents
      if (amount !== null) {
        refundParams.amount = Math.round(amount * 100);
      }

      const stripe = this._getStripe();
      const refund = await stripe.refunds.create(refundParams);

      return {
        id: refund.id,
        amount: refund.amount / 100, // Convert back to dollars
        status: refund.status,
        reason: refund.reason,
        created: refund.created,
      };
    } catch (error) {
      throw new BusinessRuleError(`Failed to create refund: ${error.message}`);
    }
  }

  /**
   * Retrieve a refund
   * @param {string} refundId - Refund ID
   * @returns {Promise<Object>} Refund details
   */
  async retrieveRefund(refundId) {
    try {
      const stripe = this._getStripe();
      const refund = await stripe.refunds.retrieve(refundId);
      return {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
        reason: refund.reason,
        created: refund.created,
      };
    } catch (error) {
      throw new BusinessRuleError(`Failed to retrieve refund: ${error.message}`);
    }
  }

  /**
   * Construct and verify webhook event
   * @param {string} payload - Raw request body
   * @param {string} signature - Stripe signature header
   * @returns {Object} Verified webhook event
   */
  constructWebhookEvent(payload, signature) {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
      }

      const stripe = this._getStripe();
      return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      throw new BusinessRuleError(`Webhook signature verification failed: ${error.message}`);
    }
  }

  /**
   * Get payment method details
   * @param {string} paymentMethodId - Payment method ID
   * @returns {Promise<Object>} Payment method details
   */
  async getPaymentMethod(paymentMethodId) {
    try {
      const stripe = this._getStripe();
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      return {
        id: paymentMethod.id,
        type: paymentMethod.type,
        card: paymentMethod.card ? {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          expMonth: paymentMethod.card.exp_month,
          expYear: paymentMethod.card.exp_year,
        } : null,
      };
    } catch (error) {
      throw new BusinessRuleError(`Failed to retrieve payment method: ${error.message}`);
    }
  }
}

export default new StripeService();
