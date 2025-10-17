import binRepo from "../../repositories/bin.repository.js";

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
 * GET /api/bins/unauthorized
 * List bins that have been flagged as unauthorized-collection
 * Accessible to authority users.
 */
export const listUnauthorized = async (_req, res) => {
  const bins = await binRepo.list(
    { status: "unauthorized-collection" },
    "-__v"
  );
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
  // Fetch current bin to enforce transition rules
  const bin = await binRepo.findById(id);
  if (!bin) return res.status(404).json({ message: "Bin not found" });

  // Determine candidate new values
  const newFill =
    typeof fillLevelPercent === "number"
      ? Math.max(0, Math.min(100, fillLevelPercent))
      : bin.fillLevelPercent;
  let nextStatus = status; // requested status if provided
  const prevFill =
    typeof bin.fillLevelPercent === "number" ? bin.fillLevelPercent : 0;

  // Business rules:
  // 1) When bin is in 'in-collection', the ONLY allowed next status is 'collected'.
  // 2) Only change to 'collected' AFTER the bin level reduces to 5% or below.
  if (bin.status === "in-collection") {
    // If a status is explicitly requested and it's not 'collected', reject.
    if (typeof nextStatus === "string" && nextStatus !== "collected") {
      return res.status(400).json({
        message:
          "While in-collection, status can only change to 'collected' and only after fillLevelPercent <= 5%",
      });
    }

    // If request wants to set collected, ensure level is <= 5 after this update
    if (nextStatus === "collected") {
      if (newFill > 5) {
        return res.status(400).json({
          message:
            "Cannot mark as collected until bin level is 5% or below during the collection session",
        });
      }
    }

    // If status not explicitly requested, auto-mark collected only when level <= 5
    if (!nextStatus) {
      if (typeof fillLevelPercent === "number" && newFill <= 5) {
        nextStatus = "collected";
      } else {
        // Keep status as in-collection until threshold is met
        nextStatus = bin.status;
      }
    }
  } else {
    // Outside of an active collection session, don't auto-set 'collected'.
    // Compute status from thresholds unless an explicit non-'collected' status is provided.
    // 0) If fill level reduced while bin is 'assigned' or 'needs-collection',
    //    mark as 'unauthorized-collection' regardless of requested status.
    const reducedOutsideSession =
      typeof fillLevelPercent === "number" && newFill < prevFill;
    const isWatchStatuses =
      bin.status === "assigned" || bin.status === "needs-collection";
    if (reducedOutsideSession && isWatchStatuses) {
      nextStatus = "unauthorized-collection";
    } else if (typeof nextStatus === "string") {
      if (nextStatus === "collected") {
        return res.status(400).json({
          message:
            "Cannot change status to 'collected' outside an active collection session (in-collection)",
        });
      }
      // Allow other manual statuses
    } else if (typeof fillLevelPercent === "number") {
      // treat 100% as overflow; >=85 needs-collection; <=5 normal (not collected outside session)
      if (newFill >= 100) nextStatus = "overflow";
      else if (newFill >= 85) nextStatus = "needs-collection";
      else nextStatus = "normal";
    }
  }

  const updated = await binRepo.updateSensor(id, {
    fillLevelPercent,
    weightKg,
    status: nextStatus,
  });
  if (!updated) return res.status(404).json({ message: "Bin not found" });
  return res.json(updated);
};

export default {
  listBins,
  updateBinSensor,
  listFlagged,
  listUnauthorized,
};
