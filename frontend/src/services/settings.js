import API from './api';

/**
 * Get all user settings
 */
export async function getAllSettings() {
  const { data } = await API.get('/api/settings');
  return data;
}

/**
 * Get user profile
 */
export async function getProfile() {
  const { data } = await API.get('/api/settings/profile');
  return data;
}

/**
 * Update user profile
 */
export async function updateProfile(profileData) {
  const { data } = await API.patch('/api/settings/profile', profileData);
  return data;
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences() {
  const { data } = await API.get('/api/settings/notifications');
  return data;
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(preferences) {
  const { data } = await API.patch('/api/settings/notifications', preferences);
  return data;
}

/**
 * Change password
 */
export async function changePassword(passwordData) {
  const { data } = await API.post('/api/settings/password', passwordData);
  return data;
}

export default {
  getAllSettings,
  getProfile,
  updateProfile,
  getNotificationPreferences,
  updateNotificationPreferences,
  changePassword,
};
