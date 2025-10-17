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
    return `Rs ${parseFloat(amount || 0).toFixed(2)}`;
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
    <div className="space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title="My Payments"
        subtitle="View and manage your waste management service payments"
      />

      {/* Outstanding Balance Card */}
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg border-0 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Outstanding Balance</h3>
                  <p className="text-sm opacity-90">Total amount due</p>
                </div>
              </div>
              <p className="text-4xl font-bold">
                {loading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  formatCurrency(outstandingBalance)
                )}
              </p>
            </div>
            <div className="text-6xl opacity-20 hidden md:block">💳</div>
          </div>
        </div>
      </Card>

      {/* Payment Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-yellow-500 hover:shadow-lg transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-2">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">
              {payments.filter(p => p.status === 'pending').length}
            </p>
          </div>
        </Card>
        <Card className="border-l-4 border-green-500 hover:shadow-lg transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-2">Paid</p>
            <p className="text-3xl font-bold text-green-600">
              {payments.filter(p => p.status === 'paid').length}
            </p>
          </div>
        </Card>
        <Card className="border-l-4 border-gray-400 hover:shadow-lg transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-2">Cancelled</p>
            <p className="text-3xl font-bold text-gray-600">
              {payments.filter(p => p.status === 'cancelled').length}
            </p>
          </div>
        </Card>
        <Card className="border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-2">Refunded</p>
            <p className="text-3xl font-bold text-blue-600">
              {payments.filter(p => p.status === 'refunded').length}
            </p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Filter Payments</h3>
              <p className="text-sm text-gray-500">Narrow down your search results</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="mt-6 flex justify-end">
            <Button 
              variant="secondary" 
              onClick={resetFilters}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-r-lg flex items-start gap-3 shadow-sm">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Payments Table */}
      <Card>
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Payment History</h3>
                <p className="text-sm text-gray-500">Track all your payment transactions</p>
              </div>
            </div>
            {filteredPayments.length > 0 && (
              <div className="px-4 py-2 bg-green-50 rounded-lg">
                <span className="text-sm font-semibold text-green-700">
                  {filteredPayments.length} {filteredPayments.length === 1 ? 'Record' : 'Records'}
                </span>
              </div>
            )}
          </div>
          
          {loading ? (
            <div className="text-center py-16">
              <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-gray-600 font-medium">Loading payments...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {payments.length === 0 ? 'No payments yet' : 'No matching payments'}
              </h3>
              <p className="text-gray-500">
                {payments.length === 0
                  ? 'Your payment history will appear here'
                  : 'Try adjusting your filters to see more results'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Invoice Number
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Paid Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Payment Method
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPayments.map((payment) => (
                      <tr key={payment._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">{payment.invoiceNumber}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(payment.dueDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-gray-900">{formatCurrency(payment.amount)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getStatusBadgeClass(payment.status)}>
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(payment.paidDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
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
                              className="shadow-sm"
                            >
                              <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                Pay Now
                              </span>
                            </Button>
                          ) : payment.status === 'refunded' ? (
                            <span className="text-xs font-medium text-blue-600 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                              </svg>
                              {formatCurrency(payment.refundAmount || payment.amount)}
                            </span>
                          ) : payment.status === 'cancelled' ? (
                            <span className="text-xs text-gray-400">Cancelled</span>
                          ) : payment.status === 'paid' ? (
                            <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Completed
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

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {filteredPayments.map((payment) => (
                  <div key={payment._id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm font-bold text-gray-900">{payment.invoiceNumber}</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-800 mb-1">{formatCurrency(payment.amount)}</p>
                        <p className="text-sm text-gray-600">Due: {formatDate(payment.dueDate)}</p>
                      </div>
                      <div>{getStatusBadgeClass(payment.status) && <span className={getStatusBadgeClass(payment.status)}>{payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}</span>}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      {payment.paidDate && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Paid Date</p>
                          <p className="font-medium text-gray-900">{formatDate(payment.paidDate)}</p>
                        </div>
                      )}
                      {payment.paymentMethod && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">Method</p>
                          <p className="font-medium text-gray-900">{payment.paymentMethod.charAt(0).toUpperCase() + payment.paymentMethod.slice(1)}</p>
                        </div>
                      )}
                    </div>

                    {(payment.status === 'pending' || payment.status === 'overdue') && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handlePayNow(payment)}
                        disabled={processing === payment._id}
                        className="w-full"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          Pay Now
                        </span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </Card>
      
      {/* Stripe Payment Modal */}
      {showStripeModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Complete Payment</h3>
                    <p className="text-sm text-white text-opacity-90">Secure payment processing</p>
                  </div>
                </div>
                <button
                  onClick={handlePaymentCancel}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="mb-6 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-blue-200">
                  <span className="text-sm font-medium text-gray-700">Invoice Number</span>
                  <span className="text-sm font-bold text-gray-900">{selectedPayment.invoiceNumber}</span>
                </div>
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-blue-200">
                  <span className="text-sm font-medium text-gray-700">Due Date</span>
                  <span className="text-sm font-bold text-gray-900">{formatDate(selectedPayment.dueDate)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-gray-900">Total Amount</span>
                  <span className="text-2xl font-bold text-blue-600">
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
        </div>
      )}
    </div>
  );
}
