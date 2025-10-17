import binRepo from "../../repositories/bin.repository.js";
import historyRepo from "../../repositories/collectionHistory.repository.js";

/**
 * POST /api/history/finish-today
 * Finishes today's schedule for the authenticated collector.
 * - Validates that all assigned bins are in 'collected' status
 * - Saves a history snapshot of all bins assigned today
 */
export const finishTodaySchedule = async (req, res) => {
  const collectorId = req.user?.sub;
  if (!collectorId) return res.status(401).json({ message: "Unauthorized" });

  // Fetch bins assigned to this collector
  const assignedBins = await binRepo.list({ assignedCollector: collectorId });
  if (!assignedBins || assignedBins.length === 0) {
    return res.status(400).json({ message: "No bins assigned for today" });
  }

  const allCollected = assignedBins.every((b) => b.status === "collected");
  if (!allCollected) {
    return res.status(400).json({
      message: "All bins must be collected before finishing the schedule",
    });
  }

  // Build snapshots
  const snapshots = assignedBins.map((b) => ({
    bin: b._id,
    code: b.code,
    type: b.type,
    capacityLiters: b.capacityLiters,
    locationDescription: b?.location?.description || "",
    fillLevelPercent: b.fillLevelPercent ?? 0,
    weightKg: b.weightKg ?? 0,
    status: b.status,
    collectedAt: b.updatedAt || new Date(),
  }));

  const history = await historyRepo.create({
    collector: collectorId,
    finishedAt: new Date(),
    bins: snapshots,
    summary: {
      totalBins: snapshots.length,
      collectedBins: snapshots.filter((s) => s.status === "collected").length,
    },
  });

  return res.status(201).json(history);
};

/**
 * GET /api/history/my
 * List collection history for authenticated collector
 */
export const listMyHistory = async (req, res) => {
  const collectorId = req.user?.sub;
  if (!collectorId) return res.status(401).json({ message: "Unauthorized" });
  const items = await historyRepo.listByCollector(collectorId);
  return res.json(items);
};

export default { finishTodaySchedule, listMyHistory };
