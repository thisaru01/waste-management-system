import paymentRepo from '../repositories/payment.repository.js';
import PaymentValidator from '../utils/paymentValidator.js';
import { NotFoundError, UnauthorizedError, BusinessRuleError } from '../utils/errors.js';

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
}

export default new PaymentService();
