import paymentService from '../../services/payment.service.js';

/**
 * Resident Payment Controller
 * Follows Single Responsibility Principle - handles HTTP for resident payment operations only
 */

/**
 * Get current user's payments
 * @route GET /api/payments
 */
export const getMyPayments = async (req, res) => {
  try {
    const residentId = req.user.sub;
    const { status } = req.query;

    const payments = await paymentService.getResidentPayments(residentId, status);
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
 * Get outstanding balance
 * @route GET /api/payments/outstanding-balance
 */
export const getOutstandingBalance = async (req, res) => {
  try {
    const residentId = req.user.sub;

    const balance = await paymentService.getOutstandingBalance(residentId);
    return res.json({ balance });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      message: err.message,
      error: err.name,
    });
  }
};

/**
 * Get payment history with filters
 * @route GET /api/payments/history
 */
export const getPaymentHistory = async (req, res) => {
  try {
    const residentId = req.user.sub;
    const { startDate, endDate, invoiceNumber } = req.query;

    const payments = await paymentService.getPaymentHistory(residentId, {
      startDate,
      endDate,
      invoiceNumber,
    });

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
 * Process payment (mark as paid)
 * @route POST /api/payments/:id/pay
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

/**
 * Create Stripe payment intent
 * @route POST /api/payments/:id/stripe/payment-intent
 */
export const createPaymentIntent = async (req, res) => {
  try {
    const { id } = req.params;
    const residentId = req.user.sub;

    const paymentIntent = await paymentService.createStripePaymentIntent(id, residentId);
    return res.json(paymentIntent);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      message: err.message,
      error: err.name,
    });
  }
};

/**
 * Get payment by pickup ID
 * @route GET /api/payments/pickup/:pickupId
 */
export const getPaymentByPickup = async (req, res) => {
  try {
    const { pickupId } = req.params;
    const residentId = req.user.sub;

    const payment = await paymentService.getPaymentByPickupId(pickupId);

    // Verify ownership
    if (payment.resident._id.toString() !== residentId.toString()) {
      return res.status(403).json({
        message: 'Access denied',
        error: 'Forbidden',
      });
    }

    return res.json(payment);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      message: err.message,
      error: err.name,
    });
  }
};
