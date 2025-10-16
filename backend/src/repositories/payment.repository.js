import Payment from '../models/payment/payment.model.js';
import mongoose from 'mongoose';

/**
 * Payment Repository
 * Handles all database operations for payments
 * Follows Single Responsibility Principle - only data access logic
 * Follows Dependency Inversion - provides abstraction for data layer
 */
export class PaymentRepository {
  /**
   * Create a new payment
   */
  async create(paymentData) {
    return Payment.create(paymentData);
  }

  /**
   * Find payment by ID
   */
  async findById(id) {
    return Payment.findById(id)
      .populate('resident', 'firstName lastName email')
      .lean();
  }

  /**
   * Find payment by invoice number
   */
  async findByInvoiceNumber(invoiceNumber) {
    return Payment.findOne({ invoiceNumber })
      .populate('resident', 'firstName lastName email')
      .lean();
  }

  /**
   * Find all payments for a specific resident
   */
  async findByResident(residentId, filter = {}) {
    return Payment.find({ resident: residentId, ...filter })
      .sort({ dueDate: -1 })
      .lean();
  }

  /**
   * List all payments with optional filter
   */
  async list(filter = {}, projection = null) {
    return Payment.find(filter, projection)
      .populate('resident', 'firstName lastName email')
      .sort({ dueDate: -1 })
      .lean();
  }

  /**
   * Update payment
   */
  async update(id, updateData) {
    return Payment.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).lean();
  }

  /**
   * Mark payment as paid
   */
  async markAsPaid(id, paymentMethod, paidDate) {
    return Payment.findByIdAndUpdate(
      id,
      {
        status: 'paid',
        paidDate: paidDate || new Date(),
        paymentMethod,
      },
      { new: true, runValidators: true }
    ).lean();
  }

  /**
   * Get outstanding balance for a resident
   */
  async getOutstandingBalance(residentId) {
    // First, let's see all payments for debugging
    const allPayments = await Payment.find({ resident: residentId });
    console.log('All payments for resident:', {
      residentId,
      count: allPayments.length,
      statuses: allPayments.map(p => ({ id: p._id, status: p.status, amount: p.amount }))
    });
    
    // IMPORTANT: When using aggregation, Mongoose will NOT cast string IDs.
    // Convert residentId to ObjectId to match stored refs.
    const residentObjectId = new mongoose.Types.ObjectId(residentId);

    const result = await Payment.aggregate([
      {
        $match: {
          resident: residentObjectId,
          status: { $in: ['pending', 'overdue'] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    const balance = result.length > 0 ? result[0].total : 0;
    console.log('Outstanding balance result:', { residentId, balance, matchedGroups: result.length });
    
    return balance;
  }

  /**
   * Update overdue payments
   */
  async updateOverduePayments() {
    const now = new Date();
    return Payment.updateMany(
      {
        status: 'pending',
        dueDate: { $lt: now },
      },
      {
        $set: { status: 'overdue' },
      }
    );
  }

  /**
   * Find payment by pickup ID
   */
  async findByPickupId(pickupId) {
    const ObjectId = mongoose.Types.ObjectId;
    const id = typeof pickupId === 'string' ? new ObjectId(pickupId) : pickupId;
    
    return Payment.findOne({ pickup: id })
      .populate('resident', 'firstName lastName email')
      .lean();
  }

  /**
   * Find payment by Stripe payment intent ID
   */
  async findByStripePaymentIntentId(paymentIntentId) {
    return Payment.findOne({ stripePaymentIntentId: paymentIntentId })
      .populate('resident', 'firstName lastName email')
      .lean();
  }

  /**
   * Update payment with Stripe details
   */
  async updateStripeDetails(id, stripeData) {
    return Payment.findByIdAndUpdate(
      id,
      {
        stripePaymentIntentId: stripeData.paymentIntentId,
        stripeClientSecret: stripeData.clientSecret,
        transactionId: stripeData.transactionId,
      },
      { new: true, runValidators: true }
    ).lean();
  }

  /**
   * Process refund for payment
   */
  async processRefund(id, refundData) {
    const updateData = {
      status: refundData.isFullRefund ? 'refunded' : 'partially_refunded',
      refundAmount: refundData.amount,
      refundReason: refundData.reason,
      refundDate: new Date(),
      stripeRefundId: refundData.stripeRefundId,
    };

    return Payment.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).lean();
  }

  /**
   * Cancel payment
   */
  async cancel(id, reason = null) {
    return Payment.findByIdAndUpdate(
      id,
      {
        status: 'cancelled',
        ...(reason && { refundReason: reason }),
      },
      { new: true, runValidators: true }
    ).lean();
  }

  /**
   * Delete payment
   */
  async delete(id) {
    return Payment.findByIdAndDelete(id).lean();
  }
}

export default new PaymentRepository();
