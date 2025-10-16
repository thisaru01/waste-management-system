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

export default {
  listBins,
  updateBinSensor,
  listFlaggedBins,
  listAssignedBinsForCollector,
  assignBin,
  unassignBin,
};
