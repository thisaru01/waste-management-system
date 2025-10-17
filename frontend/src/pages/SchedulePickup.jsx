import { useState, useEffect } from 'react';
import { schedulePickup, getMyPickups, cancelPickup } from '../services/pickups';
import PageHeader from '../components/ui/PageHeader';
import { Card, CardHeader } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';

export default function SchedulePickup() {
  const [form, setForm] = useState({
    date: '',
    itemType: '',
    itemWeight: '',
    notes: '',
  });
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load pickups on mount
  useEffect(() => {
    loadPickups();
  }, []);

  const loadPickups = async () => {
    try {
      const data = await getMyPickups();
      setPickups(data);
    } catch (err) {
      console.error('Failed to load pickups:', err);
    }
  };

  const handleCancelPickup = async (pickupId) => {
    if (!confirm('Are you sure you want to cancel this pickup?')) {
      return;
    }

    try {
      setLoading(true);
      await cancelPickup(pickupId);
      setSuccess('Pickup cancelled successfully!');
      setError('');
      await loadPickups(); // Reload pickups
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel pickup');
      setSuccess('');
      console.error('Failed to cancel pickup:', err);
    } finally {
      setLoading(false);
    }
  };

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await schedulePickup(form);
      setSuccess('Pickup scheduled successfully!');
      setForm({ date: '', itemType: '', itemWeight: '', notes: '' });
      await loadPickups();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to schedule pickup');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getStatusBadge = (status) => {
    const baseClasses = 'px-3 py-1 rounded-full text-sm font-medium';
    const colorMap = {
      scheduled: 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`${baseClasses} ${colorMap[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Schedule Pickup"
        subtitle="Schedule waste collection pickups for your residence"
      />

      <div className="space-y-8 mt-6">
        {/* Schedule Pickup Form */}
        <Card>
          <div className="p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Schedule New Pickup</h2>
                <p className="text-sm text-gray-500">Fill in the details below to schedule your waste collection</p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg flex items-start gap-3">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-r-lg flex items-start gap-3">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-8">
              {/* Date Selection */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                <div className="flex items-start gap-3 mb-4">
                  <svg className="w-5 h-5 text-blue-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">When do you need pickup?</h3>
                    <p className="text-sm text-gray-600">Choose a convenient date for waste collection</p>
                  </div>
                </div>
                <Input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={onChange}
                  required
                  label="Pickup Date"
                  min={new Date().toISOString().split('T')[0]}
                  className="bg-white"
                />
              </div>

              {/* Pickup Details */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Pickup Details</h3>
                    <p className="text-sm text-gray-600">Tell us what you need collected</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Select
                    name="itemType"
                    value={form.itemType}
                    onChange={onChange}
                    required
                    label="Item Type"
                  >
                    <option value="">Select Item Type</option>
                    <option value="Couch">🛋️ Couch</option>
                    <option value="Refrigerator">❄️ Refrigerator</option>
                    <option value="Mattress">🛏️ Mattress</option>
                    <option value="TV">📺 TV</option>
                    <option value="Washing Machine">🧺 Washing Machine</option>
                    <option value="Desk">🪑 Desk</option>
                    <option value="Chair">💺 Chair</option>
                    <option value="Other">📦 Other</option>
                  </Select>

                  <Select
                    name="itemWeight"
                    value={form.itemWeight}
                    onChange={onChange}
                    required
                    label="Item Size/Weight"
                  >
                    <option value="">Select Item Weight</option>
                    <option value="Small">Small (Easy to carry)</option>
                    <option value="Medium">Medium (1-2 people)</option>
                    <option value="Large">Large (2-3 people)</option>
                    <option value="Extra Large">Extra Large (Special equipment)</option>
                  </Select>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={onChange}
                    rows="4"
                    placeholder="e.g., Item location, access instructions, special handling requirements..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-2">Help our collectors by providing specific details about item location or access</p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Note:</span> You can cancel scheduled pickups anytime before collection
                </p>
                <Button type="submit" disabled={loading} className="min-w-[200px] shadow-lg">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Scheduling...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Schedule Pickup
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </Card>

        {/* Upcoming Pickups */}
        <Card>
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Your Pickups</h2>
                  <p className="text-sm text-gray-500">View and manage your scheduled collections</p>
                </div>
              </div>
              {pickups.length > 0 && (
                <div className="px-4 py-2 bg-blue-50 rounded-lg">
                  <span className="text-sm font-semibold text-blue-700">{pickups.length} Total</span>
                </div>
              )}
            </div>

            {pickups.length > 0 ? (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Date
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Item Type
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Size
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pickups.map((pickup) => (
                        <tr key={pickup._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">{formatDate(pickup.date)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900 font-medium">{pickup.itemType}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-700">{pickup.itemWeight}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(pickup.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {pickup.status === 'scheduled' && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleCancelPickup(pickup._id)}
                                disabled={loading}
                                className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
                              >
                                Cancel
                              </Button>
                            )}
                            {pickup.status === 'cancelled' && (
                              <span className="text-gray-400 text-xs">Cancelled</span>
                            )}
                            {pickup.status === 'completed' && (
                              <span className="text-green-600 text-xs font-medium flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Done
                              </span>
                            )}
                            {pickup.status === 'in-progress' && (
                              <span className="text-blue-600 text-xs font-medium flex items-center gap-1">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                On the way
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {pickups.map((pickup) => (
                    <div key={pickup._id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm font-semibold text-gray-900">{formatDate(pickup.date)}</span>
                          </div>
                          <p className="text-lg font-bold text-gray-800">{pickup.itemType}</p>
                          <p className="text-sm text-gray-600 mt-1">Size: {pickup.itemWeight}</p>
                        </div>
                        <div>{getStatusBadge(pickup.status)}</div>
                      </div>
                      
                      {pickup.notes && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600">{pickup.notes}</p>
                        </div>
                      )}

                      {pickup.status === 'scheduled' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleCancelPickup(pickup._id)}
                          disabled={loading}
                          className="w-full hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                        >
                          Cancel Pickup
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No pickups scheduled</h3>
                <p className="text-gray-500 mb-6">Schedule your first pickup using the form above</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg text-sm text-blue-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Schedule pickups at least 24 hours in advance
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
