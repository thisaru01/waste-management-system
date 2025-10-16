import paymentService from '../../services/payment.service.js';

/**
 * Admin Payment Controller
 * Follows Single Responsibility Principle - handles HTTP for admin payment operations only
 */

/**
 * Create a new payment/invoice (Admin)
 * @route POST /api/admin/payments
 */
export const createPayment = async (req, res) => {
  try {
    const { residentId, amount, dueDate, description, period, invoiceNumber } = req.body;

    const payment = await paymentService.createPayment({
      residentId,
      amount,
      dueDate,
      description,
      period,
      invoiceNumber,
    });

    return res.status(201).json(payment);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      message: err.message,
      error: err.name,
    });
  }
};

/**
 * Get all payments (Admin)
 * @route GET /api/admin/payments
 */
export const listAllPayments = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const payments = await paymentService.listAllPayments(filter);
    return res.json(payments);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      message: err.message,
      error: err.name,
    });
  }
};

/**
 * Get payment by ID (Admin)
 * @route GET /api/admin/payments/:id
 */
export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await paymentService.getPaymentById(id);
    return res.json(payment);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      message: err.message,
      error: err.name,
    });
  }
};

/**
 * Update payment (Admin)
 * @route PATCH /api/admin/payments/:id
 */
export const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const payment = await paymentService.updatePayment(id, updateData);
    return res.json(payment);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      message: err.message,
      error: err.name,
    });
  }
};

/**
 * Cancel payment (Admin)
 * @route PATCH /api/admin/payments/:id/cancel
 */
export const cancelPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await paymentService.cancelPayment(id);
    return res.json(payment);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      message: err.message,
      error: err.name,
    });
  }
};

/**
 * Process payment (Admin)
 * @route POST /api/admin/payments/:id/process
 */
export const processPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;

    const payment = await paymentService.processPayment(id, paymentMethod);
    return res.json(payment);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      message: err.message,
      error: err.name,
    });
  }
};
