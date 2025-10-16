import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyPayments, getOutstandingBalance } from '../services/payments';
import StripePayment from '../components/StripePayment';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import PageHeader from '../components/ui/PageHeader';

/**
 * Payments Page
 * Displays payment list and allows residents to make payments via Stripe
 */
export default function PaymentsPage() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [outstandingBalance, setOutstandingBalance] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPayments();
    loadBalance();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await getMyPayments();
      setPayments(data);
    } catch (err) {
      setError('Failed to load payments');
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBalance = async () => {
    try {
      const { balance } = await getOutstandingBalance();
      setOutstandingBalance(balance);
    } catch (err) {
      console.error('Failed to load balance:', err);
    }
  };

  const handlePaymentSuccess = (paymentIntent) => {
    console.log('Payment successful:', paymentIntent);
    setSelectedPayment(null);
    loadPayments();
    loadBalance();
    alert('Payment successful! Your payment has been processed.');
  };

  const handlePaymentCancel = () => {
    setSelectedPayment(null);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      refunded: 'bg-blue-100 text-blue-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show payment form if a payment is selected
  if (selectedPayment) {
    return (
      <div className="max-w-2xl mx-auto">
        <PageHeader
          title="Make Payment"
          description={`Invoice ${selectedPayment.invoiceNumber}`}
        />
        <StripePayment
          paymentId={selectedPayment._id}
          amount={selectedPayment.amount}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Manage your payments and view payment history"
      />

      {/* Outstanding Balance Card */}
      <Card className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Outstanding Balance</p>
            <h2 className="text-4xl font-bold mt-2">${outstandingBalance.toFixed(2)}</h2>
          </div>
          <div className="text-5xl opacity-20">💳</div>
        </div>
      </Card>

      {/* Payment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            {payments.filter(p => p.status === 'pending').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Paid</p>
          <p className="text-2xl font-bold text-green-600">
            {payments.filter(p => p.status === 'paid').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Overdue</p>
          <p className="text-2xl font-bold text-red-600">
            {payments.filter(p => p.status === 'overdue').length}
          </p>
        </Card>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Payments Table */}
      <Card>
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Payment History</h3>
        </div>
        <Table>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  No payments found
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment._id}>
                  <td className="font-mono text-sm">{payment.invoiceNumber}</td>
                  <td>{payment.description}</td>
                  <td className="font-semibold">${payment.amount.toFixed(2)}</td>
                  <td>{formatDate(payment.dueDate)}</td>
                  <td>{getStatusBadge(payment.status)}</td>
                  <td>
                    {(payment.status === 'pending' || payment.status === 'overdue') && (
                      <Button
                        size="sm"
                        onClick={() => setSelectedPayment(payment)}
                      >
                        Pay Now
                      </Button>
                    )}
                    {payment.status === 'paid' && payment.paidDate && (
                      <span className="text-xs text-gray-500">
                        Paid on {formatDate(payment.paidDate)}
                      </span>
                    )}
                    {payment.status === 'refunded' && (
                      <span className="text-xs text-gray-500">
                        Refunded ${payment.refundAmount?.toFixed(2)}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
