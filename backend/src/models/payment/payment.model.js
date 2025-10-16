import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Payment Schema
 * Represents a payment/invoice for waste management services
 * Follows Single Responsibility Principle - only defines data structure
 */
const PaymentSchema = new Schema(
  {
    invoiceNumber: {
      type: String,
      required: [true, 'Invoice number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    resident: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Resident reference is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be positive'],
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue', 'cancelled', 'refunded', 'partially_refunded'],
      default: 'pending',
      index: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
      index: true,
    },
    paidDate: {
      type: Date,
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'bank_transfer', 'online', 'stripe', null],
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: 'Waste management service fee',
    },
    period: {
      type: String,
      trim: true,
      default: '',
    },
    // Stripe Integration Fields
    stripePaymentIntentId: {
      type: String,
      default: null,
      index: true,
    },
    stripeClientSecret: {
      type: String,
      default: null,
    },
    transactionId: {
      type: String,
      default: null,
      index: true,
    },
    // Pickup Reference
    pickup: {
      type: Schema.Types.ObjectId,
      ref: 'Pickup',
      default: null,
      index: true,
    },
    // Refund Information
    refundAmount: {
      type: Number,
      default: 0,
      min: [0, 'Refund amount must be positive'],
    },
    refundReason: {
      type: String,
      trim: true,
      default: null,
    },
    refundDate: {
      type: Date,
      default: null,
    },
    stripeRefundId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient querying
PaymentSchema.index({ resident: 1, status: 1 });
PaymentSchema.index({ resident: 1, dueDate: -1 });
PaymentSchema.index({ pickup: 1 });
PaymentSchema.index({ stripePaymentIntentId: 1 });

// Virtual for calculating if overdue
PaymentSchema.virtual('isOverdue').get(function () {
  return this.status === 'pending' && this.dueDate < new Date();
});

// Ensure virtuals are included in JSON
PaymentSchema.set('toJSON', { virtuals: true });
PaymentSchema.set('toObject', { virtuals: true });

export default mongoose.model('Payment', PaymentSchema);
