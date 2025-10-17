import binRepo from "../../repositories/bin.repository.js";
import User from "../../models/user/user.model.js";

/**
 * GET /api/assignments/my-bins
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
 * PATCH /api/assignments/bins/:id/assign
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
 * PATCH /api/assignments/bins/:id/unassign
 * Clear collector assignment from a bin.
 */
export const clearAssignment = async (req, res) => {
  const { id } = req.params;
  const updated = await binRepo.clearAssignment(id);
  if (!updated) return res.status(404).json({ message: "Bin not found" });
  return res.json(updated);
};

export default {
  listAssignedForMe,
  assignCollector,
  clearAssignment,
};
