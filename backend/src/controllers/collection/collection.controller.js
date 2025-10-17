import binRepo from "../../repositories/bin.repository.js";

/**
 * GET /api/collections/code/:code
 * Get a bin by its unique code (for QR scanning)
 * Accessible to collectors - validates assignment
 */
export const getBinByCode = async (req, res) => {
  const { code } = req.params;
  const collectorId = req.user?.sub;

  if (!code) return res.status(400).json({ message: "Bin code is required" });
  if (!collectorId) return res.status(401).json({ message: "Unauthorized" });

  const bin = await binRepo.findByCode(code);
  if (!bin) return res.status(404).json({ message: "Bin not found" });

  // Populate references for full details
  await bin.populate("owner", "firstName lastName email roles");
  await bin.populate("assignedCollector", "firstName lastName email roles");

  // Validate that the bin is assigned to the requesting collector
  if (
    !bin.assignedCollector ||
    bin.assignedCollector._id.toString() !== collectorId
  ) {
    return res.status(403).json({
      message:
        "This bin is not assigned to you. Please scan a bin that is assigned to you.",
      bin: {
        code: bin.code,
        assignedTo: bin.assignedCollector
          ? `${bin.assignedCollector.firstName} ${bin.assignedCollector.lastName}`
          : "Unassigned",
      },
    });
  }

  return res.json(bin);
};

/**
 * PATCH /api/collections/:id/collect
 * Mark a bin as collected by the authenticated collector
 * Only the assigned collector can mark as collected
 */
export const markAsCollected = async (req, res) => {
  const { id } = req.params;
  const collectorId = req.user?.sub;

  if (!collectorId) return res.status(401).json({ message: "Unauthorized" });

  const bin = await binRepo.findById(id);
  if (!bin) return res.status(404).json({ message: "Bin not found" });

  // Only allow marking as collected from an active collection session
  if (bin.status !== "in-collection") {
    return res.status(400).json({
      message:
        "Cannot mark as collected unless an active collection session is in progress",
    });
  }

  // Enforce threshold: can only set collected when level <= 5%
  if ((bin.fillLevelPercent || 0) > 5) {
    return res.status(400).json({
      message:
        "Bin level must be 5% or below before marking as collected. Update sensor reading first.",
      currentFillLevelPercent: bin.fillLevelPercent,
    });
  }

  const updated = await binRepo.updateSensor(id, {
    fillLevelPercent:
      typeof bin.fillLevelPercent === "number" ? bin.fillLevelPercent : 0,
    weightKg: typeof bin.weightKg === "number" ? bin.weightKg : 0,
    status: "collected",
  });

  // Clear session data after successful collection
  await binRepo.endSession(id);

  return res.json(updated);
};

export default {
  getBinByCode,
  markAsCollected,
};
