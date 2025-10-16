import API from './api';

/**
 * Schedule a new pickup
 */
export async function schedulePickup({ date, itemType, itemWeight, notes }) {
  const body = { date, itemType, itemWeight, notes };
  const { data } = await API.post('/api/pickups', body);
  return data;
}

/**
 * Get current user's pickups
 */
export async function getMyPickups(status = null) {
  const params = status ? { status } : {};
  const { data } = await API.get('/api/pickups', { params });
  return data;
}

/**
 * Update a pickup
 */
export async function updatePickup(id, updateData) {
  const { data } = await API.patch(`/api/pickups/${id}`, updateData);
  return data;
}

/**
 * Cancel a pickup
 */
export async function cancelPickup(id) {
  const { data } = await API.patch(`/api/pickups/${id}/cancel`);
  return data;
}

/**
 * Get all pickups (admin)
 */
export async function getAllPickups(status = null) {
  const params = status ? { status } : {};
  const { data } = await API.get('/api/admin/pickups', { params });
  return data;
}

/**
 * Update pickup status (admin)
 */
export async function updatePickupStatus(id, status) {
  const { data } = await API.patch(`/api/admin/pickups/${id}/status`, { status });
  return data;
}

export default {
  schedulePickup,
  getMyPickups,
  updatePickup,
  cancelPickup,
  getAllPickups,
  updatePickupStatus,
};
