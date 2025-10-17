import API from "./api";

/**
 * List all bins (admin only).
 * @returns {Promise<Array>} Array of bin documents
 */
export async function listBins() {
  const { data } = await API.get("/api/bins");
  return data;
}

/**
 * List flagged bins (fill >= threshold). Uses auth token if available.
 * @param {number} threshold
 */
export async function listFlaggedBins(threshold = 85) {
  const { data } = await API.get(
    `/api/bins/flagged?threshold=${encodeURIComponent(threshold)}`
  );
  return data;
}

/**
 * List bins assigned to the authenticated collector
 * @returns {Promise<Array>} Array of bin documents
 */
export async function listAssignedBinsForCollector() {
  const { data } = await API.get("/api/bins/assigned");
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

/** Assign a bin to a collector user */
export async function assignBin(id, collectorId) {
  const { data } = await API.patch(`/api/bins/${id}/assign`, { collectorId });
  return data;
}

/** Clear collector assignment for a bin */
export async function unassignBin(id) {
  const { data } = await API.patch(`/api/bins/${id}/unassign`);
  return data;
}

/**
 * Get a bin by its unique code (for QR scanning)
 * @param {string} code Bin code
 * @returns {Promise<Object>} Bin document
 */
export async function getBinByCode(code) {
  const { data } = await API.get(`/api/bins/code/${encodeURIComponent(code)}`);
  return data;
}

/**
 * Mark a bin as collected
 * @param {string} id Bin ID
 * @returns {Promise<Object>} Updated bin
 */
export async function markBinAsCollected(id) {
  const { data } = await API.patch(`/api/bins/${id}/collect`);
  return data;
}

/**
 * Start a collection session for a bin
 * @param {string} id Bin ID
 * @returns {Promise<Object>} Session data and updated bin
 */
export async function startCollectionSession(id) {
  const { data } = await API.post(`/api/bins/${id}/start-session`);
  return data;
}

/**
 * Check the status of an active collection session
 * @param {string} id Bin ID
 * @returns {Promise<Object>} Session status and bin data
 */
export async function checkCollectionSession(id) {
  const { data } = await API.get(`/api/bins/${id}/check-session`);
  return data;
}

export default {
  listBins,
  updateBinSensor,
  listFlaggedBins,
  listAssignedBinsForCollector,
  assignBin,
  unassignBin,
  getBinByCode,
  markBinAsCollected,
  startCollectionSession,
  checkCollectionSession,
};
