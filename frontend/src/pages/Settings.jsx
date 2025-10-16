import { useState, useEffect } from 'react';
import PageHeader from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import {
  getAllSettings,
  updateProfile,
  updateNotificationPreferences,
  changePassword,
} from '../services/settings';

export default function Settings() {
  // Profile state
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    phone: '',
  });

  // Notification preferences state
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    inAppNotifications: true,
  });

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      setError('');

      const data = await getAllSettings();
      
      setProfile({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        address: data.address || '',
        phone: data.phone || '',
      });

      setNotifications({
        emailNotifications: data.emailNotifications ?? true,
        smsNotifications: data.smsNotifications ?? false,
        inAppNotifications: data.inAppNotifications ?? true,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load settings');
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await updateProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        address: profile.address,
        phone: profile.phone,
      });

      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      console.error('Error updating profile:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveNotifications(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await updateNotificationPreferences(notifications);

      setSuccess('Notification preferences updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update notification preferences');
      console.error('Error updating notifications:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await changePassword(passwordForm);

      setSuccess('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
      console.error('Error changing password:', err);
    } finally {
      setSaving(false);
    }
  }

  function handleProfileChange(field, value) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  function handleNotificationChange(field, checked) {
    setNotifications((prev) => ({ ...prev, [field]: checked }));
  }

  function handlePasswordChange(field, value) {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader title="Settings" subtitle="Manage your account settings and preferences" />

      {/* Success Alert */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
          <p>{success}</p>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      )}

      {/* Profile Section */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Profile</h3>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Input
              label="Name"
              type="text"
              value={profile.firstName}
              onChange={(e) => handleProfileChange('firstName', e.target.value)}
              placeholder="Enter your first name"
              required
            />
            <Input
              label="Last Name"
              type="text"
              value={profile.lastName}
              onChange={(e) => handleProfileChange('lastName', e.target.value)}
              placeholder="Enter your last name"
              required
            />
            <Input
              label="Email"
              type="email"
              value={profile.email}
              disabled
              className="bg-gray-100"
            />
            <Input
              label="Address"
              type="text"
              value={profile.address}
              onChange={(e) => handleProfileChange('address', e.target.value)}
              placeholder="Enter your address"
            />
            <Input
              label="Phone"
              type="tel"
              value={profile.phone}
              onChange={(e) => handleProfileChange('phone', e.target.value)}
              placeholder="Enter your phone number"
            />
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </form>
        </div>
      </Card>

      {/* Notification Preferences Section */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
          <form onSubmit={handleSaveNotifications} className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="emailNotifications"
                checked={notifications.emailNotifications}
                onChange={(e) =>
                  handleNotificationChange('emailNotifications', e.target.checked)
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="emailNotifications" className="ml-3 text-sm text-gray-700">
                Email Notifications
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="smsNotifications"
                checked={notifications.smsNotifications}
                onChange={(e) =>
                  handleNotificationChange('smsNotifications', e.target.checked)
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="smsNotifications" className="ml-3 text-sm text-gray-700">
                SMS Notifications
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="inAppNotifications"
                checked={notifications.inAppNotifications}
                onChange={(e) =>
                  handleNotificationChange('inAppNotifications', e.target.checked)
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="inAppNotifications" className="ml-3 text-sm text-gray-700">
                In-App Notifications
              </label>
            </div>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </form>
        </div>
      </Card>

      {/* Account Security Section */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Account Security</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
              placeholder="Enter current password"
              required
            />
            <Input
              label="New Password"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
              placeholder="Enter new password"
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
              placeholder="Confirm new password"
              required
            />
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
