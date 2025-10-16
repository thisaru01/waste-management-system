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
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Schedule Pickup"
        subtitle="Schedule waste collection pickups for your residence"
      />

      <div className="space-y-6 mt-6">
        {/* Schedule Pickup Form */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6">Schedule Pickup</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded">
                {success}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <Input
                type="date"
                name="date"
                value={form.date}
                onChange={onChange}
                required
                label="Select Date"
                min={new Date().toISOString().split('T')[0]}
              />

              <div>
                <h3 className="text-base font-medium mb-4">Pickup Details</h3>
                <div className="space-y-4">
                  <Select
                    name="itemType"
                    value={form.itemType}
                    onChange={onChange}
                    required
                    label="Select Item Type"
                  >
                    <option value="">Select Item Type</option>
                    <option value="Couch">Couch</option>
                    <option value="Refrigerator">Refrigerator</option>
                    <option value="Mattress">Mattress</option>
                    <option value="TV">TV</option>
                    <option value="Washing Machine">Washing Machine</option>
                    <option value="Desk">Desk</option>
                    <option value="Chair">Chair</option>
                    <option value="Other">Other</option>
                  </Select>

                  <Select
                    name="itemWeight"
                    value={form.itemWeight}
                    onChange={onChange}
                    required
                    label="Select Item Weight"
                  >
                    <option value="">Select Item Weight</option>
                    <option value="Small">Small</option>
                    <option value="Medium">Medium</option>
                    <option value="Large">Large</option>
                    <option value="Extra Large">Extra Large</option>
                  </Select>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Any Notes For The Collectors
                    </label>
                    <textarea
                      name="notes"
                      value={form.notes}
                      onChange={onChange}
                      rows="4"
                      placeholder="Any Notes For The Collectors"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Scheduling...' : 'Schedule Pickup'}
                </Button>
              </div>
            </form>
          </div>
        </Card>

        {/* Upcoming Pickups */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6">Upcoming Pickups</h2>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pickups.length > 0 ? (
                    pickups.map((pickup) => (
                      <tr key={pickup._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(pickup.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {pickup.itemType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {pickup.itemWeight}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {getStatusBadge(pickup.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {pickup.status === 'scheduled' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelPickup(pickup._id)}
                              disabled={loading}
                            >
                              Cancel
                            </Button>
                          )}
                          {pickup.status === 'cancelled' && (
                            <span className="text-gray-400">-</span>
                          )}
                          {pickup.status === 'completed' && (
                            <span className="text-gray-400">-</span>
                          )}
                          {pickup.status === 'in-progress' && (
                            <span className="text-gray-400">In Progress</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        No pickups scheduled yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
