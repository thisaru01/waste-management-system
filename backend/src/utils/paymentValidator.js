import { ValidationError } from './errors.js';

/**
 * Payment Validation Utility
 * Follows Single Responsibility Principle - only validates payment data
 * Follows DRY - centralized validation logic, no duplication
 */
export class PaymentValidator {
  /**
   * Validate payment amount is positive
   */
  static validateAmount(amount) {
    const numAmount = Number(amount);

    if (isNaN(numAmount)) {
      throw new ValidationError('Amount must be a valid number');
    }

    if (numAmount <= 0) {
      throw new ValidationError('Amount must be greater than zero');
    }

    return numAmount;
  }

  /**
   * Validate payment status
   */
  static validateStatus(status) {
    const validStatuses = ['pending', 'paid', 'overdue', 'cancelled'];

    if (!validStatuses.includes(status)) {
      throw new ValidationError(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      );
    }

    return status;
  }

  /**
   * Validate payment method
   */
  static validatePaymentMethod(method) {
    const validMethods = ['cash', 'card', 'bank_transfer', 'online', 'stripe'];

    if (method && !validMethods.includes(method)) {
      throw new ValidationError(
        `Invalid payment method. Must be one of: ${validMethods.join(', ')}`
      );
    }

    return method;
  }

  /**
   * Validate invoice number format
   */
  static validateInvoiceNumber(invoiceNumber) {
    if (!invoiceNumber || invoiceNumber.trim() === '') {
      throw new ValidationError('Invoice number is required');
    }

    // Format: INV-YYYYMMDD-XXX
    const pattern = /^INV-\d{8}-\d{3}$/;
    if (!pattern.test(invoiceNumber)) {
      throw new ValidationError(
        'Invoice number must follow format: INV-YYYYMMDD-XXX'
      );
    }

    return invoiceNumber.trim();
  }

  /**
   * Validate required fields for payment creation
   */
  static validatePaymentData({ invoiceNumber, amount, dueDate }) {
    const errors = [];

    if (!invoiceNumber || invoiceNumber.trim() === '') {
      errors.push('Invoice number is required');
    }

    if (!amount) {
      errors.push('Amount is required');
    }

    if (!dueDate) {
      errors.push('Due date is required');
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '));
    }
  }

  /**
   * Validate date is valid
   */
  static validateDate(date, fieldName = 'Date') {
    const dateObj = new Date(date);

    if (isNaN(dateObj.getTime())) {
      throw new ValidationError(`${fieldName} must be a valid date`);
    }

    return dateObj;
  }

  /**
   * Validate if payment can be modified
   */
  static canModifyPayment(payment) {
    const nonModifiableStatuses = ['paid', 'cancelled'];

    if (nonModifiableStatuses.includes(payment.status)) {
      throw new ValidationError(
        `Cannot modify ${payment.status} payments`
      );
    }

    return true;
  }

  /**
   * Validate if payment can be cancelled
   */
  static canCancelPayment(payment) {
    if (payment.status === 'paid') {
      throw new ValidationError('Cannot cancel paid payments');
    }

    return true;
  }

  /**
   * Sanitize update data
   */
  static sanitizeUpdateData(updateData) {
    const allowedFields = ['amount', 'dueDate', 'description', 'period'];
    const sanitized = {};

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        sanitized[field] = updateData[field];
      }
    });

    return sanitized;
  }

  /**
   * Generate invoice number
   */
  static generateInvoiceNumber(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');

    return `INV-${year}${month}${day}-${random}`;
  }
}

export default PaymentValidator;
