import API from './api';

/**
 * Get current user's payments
 */
export async function getMyPayments(status = null) {
  const params = status ? { status } : {};
  const { data } = await API.get('/api/payments', { params });
  return data;
}

/**
 * Get outstanding balance
 */
export async function getOutstandingBalance() {
  const { data } = await API.get('/api/payments/outstanding-balance');
  return data;
}

/**
 * Get payment history with filters
 */
export async function getPaymentHistory(filters = {}) {
  const { data } = await API.get('/api/payments/history', { params: filters });
  return data;
}

/**
 * Process payment (mark as paid)
 */
export async function processPayment(id, paymentMethod) {
  const { data } = await API.post(`/api/payments/${id}/pay`, { paymentMethod });
  return data;
}

/**
 * Create payment/invoice (admin)
 */
export async function createPayment(paymentData) {
  const { data } = await API.post('/api/admin/payments', paymentData);
  return data;
}

/**
 * Get all payments (admin)
 */
export async function getAllPayments(status = null) {
  const params = status ? { status } : {};
  const { data } = await API.get('/api/admin/payments', { params });
  return data;
}

/**
 * Update payment (admin)
 */
export async function updatePayment(id, updateData) {
  const { data } = await API.patch(`/api/admin/payments/${id}`, updateData);
  return data;
}

/**
 * Cancel payment (admin)
 */
export async function cancelPayment(id) {
  const { data } = await API.patch(`/api/admin/payments/${id}/cancel`);
  return data;
}

/**
 * Get payment for a specific pickup
 */
export async function getPaymentByPickup(pickupId) {
  const { data } = await API.get(`/api/payments/pickup/${pickupId}`);
  return data;
}

/**
 * Create Stripe payment intent
 */
export async function createStripePaymentIntent(paymentId) {
  const { data } = await API.post(`/api/payments/${paymentId}/stripe/payment-intent`);
  return data;
}

/**
 * Get Stripe configuration (publishable key)
 */
export async function getStripeConfig() {
  const { data } = await API.get('/api/stripe/config');
  return data;
}

export default {
  getMyPayments,
  getOutstandingBalance,
  getPaymentHistory,
  processPayment,
  createPayment,
  getAllPayments,
  updatePayment,
  cancelPayment,
  getPaymentByPickup,
  createStripePaymentIntent,
  getStripeConfig,
};
