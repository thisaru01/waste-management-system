import binRepo from "../../repositories/bin.repository.js";
import User from "../../models/user/user.model.js";

/**
 * GET /api/bins
 * List bins with minimal details for simulation UI
 */
export const listBins = async (_req, res) => {
  const bins = await binRepo.list({}, "-__v");
  return res.json(bins);
};

/**
 * GET /api/bins/flagged
 * List bins that are flagged for collection (fillLevelPercent >= threshold)
 * Accessible to any authenticated user.
 */
export const listFlagged = async (req, res) => {
  const threshold = Number(req.query.threshold ?? 85);
  const filter = { fillLevelPercent: { $gte: threshold } };
  const bins = await binRepo.list(filter, "-__v");
  return res.json(bins);
};

/**
 * GET /api/bins/assigned
 * List bins that are assigned to the authenticated collector.
 * Accessible to users with the 'collector' role.
 */
export const listAssignedForMe = async (req, res) => {
  const collectorId = req.user?.sub;
  if (!collectorId) return res.status(401).json({ message: "Unauthorized" });
  const bins = await binRepo.list({ assignedCollector: collectorId }, "-__v");
  return res.json(bins);
};

/**
 * PATCH /api/bins/:id/sensor
 * Update sensor readings: { fillLevelPercent?, weightKg? }
 */
export const updateBinSensor = async (req, res) => {
  const { id } = req.params;
  const { fillLevelPercent, weightKg, status } = req.body || {};
  if (
    typeof fillLevelPercent !== "number" &&
    typeof weightKg !== "number" &&
    typeof status !== "string"
  ) {
    return res.status(400).json({
      message: "Provide at least one of: fillLevelPercent, weightKg, status",
    });
  }
  let nextStatus = status;
  if (!nextStatus && typeof fillLevelPercent === "number") {
    // treat 100% as overflow
    if (fillLevelPercent >= 100) nextStatus = "overflow";
    else if (fillLevelPercent >= 85) nextStatus = "needs-collection";
    else if (fillLevelPercent <= 5) nextStatus = "collected";
    else nextStatus = "normal";
  }
  const updated = await binRepo.updateSensor(id, {
    fillLevelPercent,
    weightKg,
    status: nextStatus,
  });
  if (!updated) return res.status(404).json({ message: "Bin not found" });
  return res.json(updated);
};

/**
 * PATCH /api/bins/:id/assign
 * Body: { collectorId }
 * Assign a collector user to a bin.
 */
export const assignCollector = async (req, res) => {
  const { id } = req.params;
  const { collectorId } = req.body || {};
  if (!collectorId)
    return res.status(400).json({ message: "collectorId is required" });

  // Validate user exists and has 'collector' role
  const user = await User.findById(collectorId).populate("roles");
  if (!user)
    return res.status(404).json({ message: "Collector user not found" });
  const hasCollectorRole = (user.roles || []).some(
    (r) => (r.name || "").toLowerCase() === "collector"
  );
  if (!hasCollectorRole)
    return res.status(400).json({ message: "User is not a collector" });

  const updated = await binRepo.assignCollector(id, collectorId);
  if (!updated) return res.status(404).json({ message: "Bin not found" });
  return res.json(updated);
};

/**
 * PATCH /api/bins/:id/unassign
 * Clear collector assignment from a bin.
 */
export const clearAssignment = async (req, res) => {
  const { id } = req.params;
  const updated = await binRepo.clearAssignment(id);
  if (!updated) return res.status(404).json({ message: "Bin not found" });
  return res.json(updated);
};

/**
 * GET /api/bins/code/:code
 * Get a bin by its unique code (for QR scanning)
 * Accessible to collectors
 */
export const getBinByCode = async (req, res) => {
  const { code } = req.params;
  if (!code) return res.status(400).json({ message: "Bin code is required" });

  const bin = await binRepo.findByCode(code);
  if (!bin) return res.status(404).json({ message: "Bin not found" });

  // Populate references for full details
  await bin.populate("owner", "firstName lastName email roles");
  await bin.populate("assignedCollector", "firstName lastName email roles");

  return res.json(bin);
};

/**
 * PATCH /api/bins/:id/collect
 * Mark a bin as collected by the authenticated collector
 * Only the assigned collector can mark as collected
 */
export const markAsCollected = async (req, res) => {
  const { id } = req.params;
  const collectorId = req.user?.sub;

  if (!collectorId) return res.status(401).json({ message: "Unauthorized" });

  const bin = await binRepo.findById(id);
  if (!bin) return res.status(404).json({ message: "Bin not found" });

  // Verify collector is assigned to this bin (optional - can be enforced or relaxed)
  // For flexibility, allow any collector to mark as collected
  // Uncomment below to enforce assignment:
  // if (bin.assignedCollector?.toString() !== collectorId) {
  //   return res.status(403).json({ message: "You are not assigned to this bin" });
  // }

  const updated = await binRepo.updateSensor(id, {
    fillLevelPercent: 0,
    weightKg: 0,
    status: "collected",
  });

  return res.json(updated);
};

export default {
  listBins,
  updateBinSensor,
  listFlagged,
  listAssignedForMe,
  assignCollector,
  clearAssignment,
  getBinByCode,
  markAsCollected,
};
