import paymentRepo from '../repositories/payment.repository.js';
import PaymentValidator from '../utils/paymentValidator.js';
import { NotFoundError, UnauthorizedError, BusinessRuleError } from '../utils/errors.js';
import stripeService from './stripe.service.js';
import mongoose from 'mongoose';

/**
 * Payment Service
 * Follows SOLID Principles:
 * - Single Responsibility: Only handles payment business logic
 * - Open/Closed: Can extend without modifying existing code
 * - Dependency Inversion: Depends on repository abstraction
 */
export class PaymentService {
  /**
   * Create a new payment/invoice
   * @param {Object} data - Payment data
   * @returns {Promise<Object>} Created payment
   */
  async createPayment({ residentId, amount, dueDate, description, period, invoiceNumber }) {
    // Generate invoice number if not provided
    const invoice = invoiceNumber || PaymentValidator.generateInvoiceNumber();

    // Validate invoice number format
    PaymentValidator.validateInvoiceNumber(invoice);

    // Validate amount
    const validAmount = PaymentValidator.validateAmount(amount);

    // Validate due date
    const validDueDate = PaymentValidator.validateDate(dueDate, 'Due date');

    // Create payment
    const payment = await paymentRepo.create({
      invoiceNumber: invoice,
      resident: residentId,
      amount: validAmount,
      dueDate: validDueDate,
      description: description?.trim() || 'Waste management service fee',
      period: period?.trim() || '',
      status: 'pending',
    });

    return payment;
  }

  /**
   * Get all payments for a specific resident
   * @param {string} residentId - Resident ID
   * @param {string} status - Optional status filter
   * @returns {Promise<Array>} List of payments
   */
  async getResidentPayments(residentId, status = null) {
    const filter = status ? { status } : {};
    return paymentRepo.findByResident(residentId, filter);
  }

  /**
   * Get resident's outstanding balance
   * @param {string} residentId - Resident ID
   * @returns {Promise<number>} Outstanding balance
   */
  async getOutstandingBalance(residentId) {
    return paymentRepo.getOutstandingBalance(residentId);
  }

  /**
   * Get all payments (admin)
   * @param {Object} filter - Optional filter
   * @returns {Promise<Array>} List of payments
   */
  async listAllPayments(filter = {}) {
    return paymentRepo.list(filter);
  }

  /**
   * Get payment by ID
   * @param {string} id - Payment ID
   * @returns {Promise<Object>} Payment object
   * @throws {NotFoundError} If payment not found
   */
  async getPaymentById(id) {
    const payment = await paymentRepo.findById(id);

    if (!payment) {
      throw new NotFoundError('Payment');
    }

    return payment;
  }

  /**
   * Get payment by invoice number
   * @param {string} invoiceNumber - Invoice number
   * @returns {Promise<Object>} Payment object
   * @throws {NotFoundError} If payment not found
   */
  async getPaymentByInvoice(invoiceNumber) {
    const payment = await paymentRepo.findByInvoiceNumber(invoiceNumber);

    if (!payment) {
      throw new NotFoundError('Payment');
    }

    return payment;
  }

  /**
   * Process payment (mark as paid)
   * @param {string} id - Payment ID
   * @param {string} paymentMethod - Payment method
   * @returns {Promise<Object>} Updated payment
   */
  async processPayment(id, paymentMethod) {
    // Get payment
    const payment = await this.getPaymentById(id);

    // Check if already paid
    if (payment.status === 'paid') {
      throw new BusinessRuleError('Payment is already paid');
    }

    // Check if cancelled
    if (payment.status === 'cancelled') {
      throw new BusinessRuleError('Cannot process cancelled payment');
    }

    // Validate payment method
    PaymentValidator.validatePaymentMethod(paymentMethod);

    // Mark as paid
    return paymentRepo.markAsPaid(id, paymentMethod, new Date());
  }

  /**
   * Update payment details (admin)
   * @param {string} id - Payment ID
   * @param {Object} updateData - Fields to update
   * @returns {Promise<Object>} Updated payment
   */
  async updatePayment(id, updateData) {
    // Get payment
    const payment = await this.getPaymentById(id);

    // Check if payment can be modified
    PaymentValidator.canModifyPayment(payment);

    // Sanitize update data
    const sanitizedData = PaymentValidator.sanitizeUpdateData(updateData);

    // Validate amount if being updated
    if (sanitizedData.amount) {
      sanitizedData.amount = PaymentValidator.validateAmount(sanitizedData.amount);
    }

    // Validate due date if being updated
    if (sanitizedData.dueDate) {
      sanitizedData.dueDate = PaymentValidator.validateDate(sanitizedData.dueDate, 'Due date');
    }

    // Trim string fields
    if (sanitizedData.description) {
      sanitizedData.description = sanitizedData.description.trim();
    }
    if (sanitizedData.period) {
      sanitizedData.period = sanitizedData.period.trim();
    }

    // Update payment
    return paymentRepo.update(id, sanitizedData);
  }

  /**
   * Cancel a payment
   * @param {string} id - Payment ID
   * @returns {Promise<Object>} Cancelled payment
   */
  async cancelPayment(id) {
    // Get payment
    const payment = await this.getPaymentById(id);

    // Check if payment can be cancelled
    PaymentValidator.canCancelPayment(payment);

    // Update status to cancelled
    return paymentRepo.update(id, { status: 'cancelled' });
  }

  /**
   * Update overdue payments (scheduled task)
   * @returns {Promise<Object>} Update result
   */
  async updateOverduePayments() {
    return paymentRepo.updateOverduePayments();
  }

  /**
   * Get payment history with filters (resident)
   * @param {string} residentId - Resident ID
   * @param {Object} filters - Date range and invoice filters
   * @returns {Promise<Array>} Filtered payments
   */
  async getPaymentHistory(residentId, { startDate, endDate, invoiceNumber }) {
    let payments = await paymentRepo.findByResident(residentId);

    // Filter by date range
    if (startDate) {
      const start = new Date(startDate);
      payments = payments.filter((p) => new Date(p.dueDate) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      payments = payments.filter((p) => new Date(p.dueDate) <= end);
    }

    // Filter by invoice number
    if (invoiceNumber) {
      payments = payments.filter((p) =>
        p.invoiceNumber.toLowerCase().includes(invoiceNumber.toLowerCase())
      );
    }

    return payments;
  }

  /**
   * Create a payment for a pickup
   * @param {Object} params - Payment parameters
   * @returns {Promise<Object>} Created payment
   */
  async createPickupPayment({ residentId, pickupId, amount, description }) {
    // Generate invoice number
    const invoiceNumber = PaymentValidator.generateInvoiceNumber();

    // Set due date (7 days from now by default)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    // Create payment
    const payment = await this.createPayment({
      residentId,
      amount,
      dueDate,
      description,
      invoiceNumber,
    });

    // Link payment to pickup
    const updatedPayment = await paymentRepo.update(payment._id, {
      pickup: pickupId,
    });

    return updatedPayment;
  }

  /**
   * Create a Stripe payment intent for a payment
   * @param {string} paymentId - Payment ID
   * @param {string} residentId - Resident ID (for authorization)
   * @returns {Promise<Object>} Payment with client secret
   */
  async createStripePaymentIntent(paymentId, residentId) {
    // Get payment
    const payment = await this.getPaymentById(paymentId);

    // Verify ownership
    if (payment.resident._id.toString() !== residentId.toString()) {
      throw new UnauthorizedError('You can only pay for your own invoices');
    }

    // Check if payment is already paid or cancelled
    if (payment.status === 'paid') {
      throw new BusinessRuleError('Payment is already paid');
    }

    if (payment.status === 'cancelled') {
      throw new BusinessRuleError('Cannot pay cancelled invoice');
    }

    if (payment.status === 'refunded') {
      throw new BusinessRuleError('Cannot pay refunded invoice');
    }

    // Check if payment intent already exists
    if (payment.stripePaymentIntentId && payment.stripeClientSecret) {
      // Verify the payment intent is still valid
      try {
        const existingIntent = await stripeService.retrievePaymentIntent(payment.stripePaymentIntentId);
        if (existingIntent.status !== 'succeeded' && existingIntent.status !== 'canceled') {
          return {
            clientSecret: payment.stripeClientSecret,
            paymentIntentId: payment.stripePaymentIntentId,
            amount: payment.amount,
          };
        }
      } catch (error) {
        // Payment intent doesn't exist or is invalid, create a new one
      }
    }

    // Create Stripe payment intent
    const paymentIntent = await stripeService.createPaymentIntent({
      amount: payment.amount,
      description: payment.description,
      metadata: {
        paymentId: payment._id.toString(),
        invoiceNumber: payment.invoiceNumber,
        residentId: residentId.toString(),
      },
    });

    // Update payment with Stripe details
    await paymentRepo.updateStripeDetails(payment._id, {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.clientSecret,
      transactionId: null, // Will be set when payment succeeds
    });

    return {
      clientSecret: paymentIntent.clientSecret,
      paymentIntentId: paymentIntent.id,
      amount: payment.amount,
    };
  }

  /**
   * Handle successful Stripe payment
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @param {Object} paymentDetails - Payment details from Stripe
   * @returns {Promise<Object>} Updated payment
   */
  async handleStripePaymentSuccess(paymentIntentId, paymentDetails) {
    // Find payment by Stripe payment intent ID
    const payment = await paymentRepo.findByStripePaymentIntentId(paymentIntentId);

    if (!payment) {
      throw new NotFoundError('Payment');
    }

    // Check if already processed
    if (payment.status === 'paid') {
      return payment;
    }

    // Mark as paid
    const updatedPayment = await paymentRepo.update(payment._id, {
      status: 'paid',
      paidDate: new Date(),
      paymentMethod: 'stripe',
      transactionId: paymentDetails.chargeId || paymentIntentId,
    });

    return updatedPayment;
  }

  /**
   * Verify and confirm Stripe payment after frontend confirms success
   * @param {string} paymentId - Payment ID
   * @param {string} paymentIntentId - Stripe Payment Intent ID
   * @returns {Promise<Object>} Updated payment
   */
  async verifyAndConfirmStripePayment(paymentId, paymentIntentId) {
    // Get payment
    const payment = await this.getPaymentById(paymentId);

    // Check if already paid
    if (payment.status === 'paid') {
      return payment;
    }

    // Retrieve payment intent from Stripe to verify it succeeded
    const paymentDetails = await stripeService.retrievePaymentIntent(paymentIntentId);

    if (paymentDetails.status !== 'succeeded') {
      throw new BusinessRuleError(`Payment has not succeeded. Current status: ${paymentDetails.status}`);
    }

    // Update payment status
    const updatedPayment = await paymentRepo.update(payment._id, {
      status: 'paid',
      paidDate: new Date(),
      paymentMethod: 'stripe',
      stripePaymentIntentId: paymentIntentId,
      transactionId: paymentDetails.charges || paymentIntentId,
    });

    console.log(`✅ Payment confirmed: ${payment.invoiceNumber} - $${payment.amount}`);

    return updatedPayment;
  }

  /**
   * Process refund for pickup cancellation
   * @param {string} pickupId - Pickup ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<Object>} Refund information
   */
  async processPickupCancellationRefund(pickupId, reason) {
    console.log('🔍 Processing refund for pickup:', pickupId);
    
    // Find payment by pickup ID
    const payment = await paymentRepo.findByPickupId(pickupId);

    if (!payment) {
      console.warn('⚠️ No payment found for pickup:', pickupId);
      throw new NotFoundError('Payment for this pickup not found');
    }

    console.log('💳 Found payment:', {
      id: payment._id,
      status: payment.status,
      amount: payment.amount,
      invoiceNumber: payment.invoiceNumber
    });

    // Check payment status
    if (payment.status === 'cancelled') {
      throw new BusinessRuleError('Payment is already cancelled');
    }

    if (payment.status === 'refunded') {
      throw new BusinessRuleError('Payment is already refunded');
    }

    // If payment was not yet paid, just cancel it
    if (payment.status === 'pending' || payment.status === 'overdue') {
      console.log('💰 Cancelling unpaid payment...');
      const cancelledPayment = await paymentRepo.cancel(payment._id, reason);
      console.log('✅ Payment cancelled successfully:', cancelledPayment._id);
      
      return {
        status: 'cancelled',
        message: 'Payment cancelled - no charge was made',
        paymentId: cancelledPayment._id,
        amount: cancelledPayment.amount
      };
    }

    // If payment was paid via Stripe, process refund
    if (payment.status === 'paid' && payment.stripePaymentIntentId) {
      try {
        const refund = await stripeService.createRefund({
          paymentIntentId: payment.stripePaymentIntentId,
          reason: 'requested_by_customer',
        });

        // Update payment with refund details
        const refundedPayment = await paymentRepo.processRefund(payment._id, {
          amount: refund.amount,
          reason,
          stripeRefundId: refund.id,
          isFullRefund: refund.amount === payment.amount,
        });

        return {
          status: 'refunded',
          amount: refund.amount,
          refundId: refund.id,
          message: 'Refund processed successfully',
        };
      } catch (error) {
        throw new BusinessRuleError(`Failed to process refund: ${error.message}`);
      }
    }

    // For other payment methods (cash, card, etc.), just mark as refunded
    const refundedPayment = await paymentRepo.processRefund(payment._id, {
      amount: payment.amount,
      reason,
      stripeRefundId: null,
      isFullRefund: true,
    });

    return {
      status: 'refunded',
      amount: payment.amount,
      message: 'Payment marked as refunded - manual refund required',
    };
  }

  /**
   * Get payment by pickup ID
   * @param {string} pickupId - Pickup ID
   * @returns {Promise<Object>} Payment
   */
  async getPaymentByPickupId(pickupId) {
    const payment = await paymentRepo.findByPickupId(pickupId);
    if (!payment) {
      throw new NotFoundError('Payment');
    }
    return payment;
  }
}

export default new PaymentService();
