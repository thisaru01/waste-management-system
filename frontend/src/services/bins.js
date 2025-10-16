import API from './api';

/**
 * List all bins (admin only).
 * @returns {Promise<Array>} Array of bin documents
 */
export async function listBins() {
  const { data } = await API.get('/api/bins');
  return data;
}

/**
 * Update bin sensor readings.
 * @param {string} id Bin ID
 * @param {{fillLevelPercent?:number, weightKg?:number}} payload
 * @returns {Promise<Object>} Updated bin
 */
export async function updateBinSensor(id, payload) {
  const { data } = await API.patch(`/api/bins/${id}/sensor`, payload);
  return data;
}

export default { listBins, updateBinSensor };
