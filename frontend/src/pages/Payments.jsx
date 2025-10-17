import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import { getMyPayments, getOutstandingBalance } from '../services/payments';
import StripePayment from '../components/StripePayment';

export default function Payments() {
  const location = useLocation(); // Detect route changes
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [outstandingBalance, setOutstandingBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(null);
  
  // Stripe payment modal state
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    invoiceNumber: '',
    status: '',
  });

  useEffect(() => {
    fetchPaymentsData();
    
    // Auto-refresh every 30 seconds when page is visible
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchPaymentsData();
      }
    }, 30000);
    
    // Refresh when window/tab becomes visible (user switches back to this tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible, refreshing payments...');
        fetchPaymentsData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Refresh when window gains focus (user clicks back into browser)
    const handleFocus = () => {
      console.log('Window gained focus, refreshing payments...');
      fetchPaymentsData();
    };
    
    window.addEventListener('focus', handleFocus);
    
    // Cleanup
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Refresh when navigating to this page (e.g., from Schedule Pickup page)
  useEffect(() => {
    console.log('Route changed to Payments page, refreshing data...');
    fetchPaymentsData();
  }, [location.pathname]);

  useEffect(() => {
    applyFilters();
  }, [payments, filters]);

  async function fetchPaymentsData() {
    try {
      setLoading(true);
      setError(null);

      const [paymentsData, balanceData] = await Promise.all([
        getMyPayments(),
        getOutstandingBalance(),
      ]);

      setPayments(paymentsData || []);
      setOutstandingBalance(balanceData?.balance || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payment data');
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...payments];

    // Filter by invoice number
    if (filters.invoiceNumber) {
      filtered = filtered.filter((payment) =>
        payment.invoiceNumber.toLowerCase().includes(filters.invoiceNumber.toLowerCase())
      );
    }

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter((payment) => payment.status === filters.status);
    }

    // Filter by date range
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filtered = filtered.filter((payment) => new Date(payment.dueDate) >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      filtered = filtered.filter((payment) => new Date(payment.dueDate) <= endDate);
    }

    setFilteredPayments(filtered);
  }

  function handleFilterChange(field, value) {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }

  function resetFilters() {
    setFilters({
      startDate: '',
      endDate: '',
      invoiceNumber: '',
      status: '',
    });
  }

  async function handlePayNow(payment) {
    setSelectedPayment(payment);
    setShowStripeModal(true);
  }

  async function handlePaymentSuccess() {
    setShowStripeModal(false);
    setSelectedPayment(null);
    
    // Refresh payment data to show updated status
    await fetchPaymentsData();
  }

  function handlePaymentCancel() {
    setShowStripeModal(false);
    setSelectedPayment(null);
  }

  function handlePaymentError(error) {
    console.error('Payment error:', error);
    setError(error.message || 'Payment failed. Please try again.');
  }

  function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function formatCurrency(amount) {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  }

  function getStatusBadgeClass(status) {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      refunded: 'bg-blue-100 text-blue-800',
      partially_refunded: 'bg-blue-100 text-blue-800',
    };
    return `${baseClasses} ${statusClasses[status] || ''}`;
  }

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'refunded', label: 'Refunded' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="My Payments"
          subtitle="View and manage your waste management service payments"
        />
      </div>

      {/* Outstanding Balance Card */}
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium mb-2">Outstanding Balance</h3>
              <p className="text-4xl font-bold">
                {loading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  formatCurrency(outstandingBalance)
                )}
              </p>
              <p className="text-sm mt-2 opacity-90">Total amount due</p>
            </div>
            <div className="text-6xl opacity-20">💳</div>
          </div>
        </div>
      </Card>

      {/* Payment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {payments.filter(p => p.status === 'pending').length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600 mb-1">Paid</p>
            <p className="text-2xl font-bold text-green-600">
              {payments.filter(p => p.status === 'paid').length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600 mb-1">Cancelled</p>
            <p className="text-2xl font-bold text-gray-600">
              {payments.filter(p => p.status === 'cancelled').length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600 mb-1">Refunded</p>
            <p className="text-2xl font-bold text-blue-600">
              {payments.filter(p => p.status === 'refunded').length}
            </p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Filter Payments</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label="Invoice Number"
              type="text"
              placeholder="Search by invoice..."
              value={filters.invoiceNumber}
              onChange={(e) => handleFilterChange('invoiceNumber', e.target.value)}
            />
            <Input
              label="Start Date"
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
            <Input
              label="End Date"
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
            <Select
              label="Status"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              options={statusOptions}
            />
          </div>
          <div className="mt-4">
            <Button variant="outline" onClick={resetFilters}>
              Reset Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      )}

      {/* Payments Table */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Payment History</h3>
          
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading payments...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {payments.length === 0
                  ? 'No payments found'
                  : 'No payments match your filters'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paid Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {payment.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(payment.dueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadgeClass(payment.status)}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(payment.paidDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.paymentMethod
                          ? payment.paymentMethod.charAt(0).toUpperCase() +
                            payment.paymentMethod.slice(1)
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {payment.status === 'pending' || payment.status === 'overdue' ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handlePayNow(payment)}
                            disabled={processing === payment._id}
                          >
                            Pay with Card
                          </Button>
                        ) : payment.status === 'refunded' ? (
                          <span className="text-xs text-blue-600">
                            Refunded: {formatCurrency(payment.refundAmount || payment.amount)}
                          </span>
                        ) : payment.status === 'cancelled' ? (
                          <span className="text-xs text-gray-500">
                            Cancelled
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
      
      {/* Stripe Payment Modal */}
      {showStripeModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Complete Payment
              </h3>
              <button
                onClick={handlePaymentCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Invoice:</span>
                <span className="text-sm font-medium">{selectedPayment.invoiceNumber}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Due Date:</span>
                <span className="text-sm font-medium">{formatDate(selectedPayment.dueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-gray-900">Amount:</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatCurrency(selectedPayment.amount)}
                </span>
              </div>
            </div>

            <StripePayment
              paymentId={selectedPayment._id}
              amount={selectedPayment.amount}
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
              onError={handlePaymentError}
            />
          </div>
        </div>
      )}
    </div>
  );
}
