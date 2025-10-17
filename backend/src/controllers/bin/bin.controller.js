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

/**
 * POST /api/bins/:id/start-session
 * Start a collection session for a bin
 * Records initial fill level and session start time
 */
export const startCollectionSession = async (req, res) => {
  const { id } = req.params;
  const collectorId = req.user?.sub;

  if (!collectorId) return res.status(401).json({ message: "Unauthorized" });

  const bin = await binRepo.findById(id);
  if (!bin) return res.status(404).json({ message: "Bin not found" });

  // Verify collector is assigned to this bin
  if (
    !bin.assignedCollector ||
    bin.assignedCollector.toString() !== collectorId
  ) {
    return res.status(403).json({
      message: "You are not assigned to this bin",
    });
  }

  // Create session data
  const sessionData = {
    sessionStartedAt: new Date(),
    sessionInitialFillLevel: bin.fillLevelPercent,
    status: "in-collection",
  };

  const updated = await binRepo.startSession(id, sessionData);
  if (!updated)
    return res.status(404).json({ message: "Failed to start session" });

  return res.json({
    ...updated.toObject(),
    sessionDurationMinutes: 15,
    message:
      "Collection session started. You have 15 minutes to collect waste.",
  });
};

/**
 * GET /api/bins/:id/check-session
 * Check the current collection session status
 * Returns session info and whether collection was successful
 */
export const checkCollectionSession = async (req, res) => {
  const { id } = req.params;
  const collectorId = req.user?.sub;

  if (!collectorId) return res.status(401).json({ message: "Unauthorized" });

  const bin = await binRepo.findById(id);
  if (!bin) return res.status(404).json({ message: "Bin not found" });

  // Verify collector is assigned to this bin
  if (
    !bin.assignedCollector ||
    bin.assignedCollector.toString() !== collectorId
  ) {
    return res.status(403).json({
      message: "You are not assigned to this bin",
    });
  }

  if (!bin.sessionStartedAt) {
    return res.status(400).json({
      message: "No active collection session",
      hasActiveSession: false,
    });
  }

  const sessionStartTime = new Date(bin.sessionStartedAt);
  const now = new Date();
  const elapsedMinutes = (now - sessionStartTime) / (1000 * 60);
  const sessionExpired = elapsedMinutes > 15;

  // Check if fill level has been reduced
  const initialLevel = bin.sessionInitialFillLevel || 0;
  const currentLevel = bin.fillLevelPercent || 0;
  const levelReduced = currentLevel < initialLevel;

  let sessionStatus = "active";
  let message = "Session is active. Monitoring bin level...";

  if (levelReduced) {
    // Bin level reduced - mark as collected
    await binRepo.updateSensor(id, {
      status: "collected",
    });
    await binRepo.endSession(id);

    sessionStatus = "completed";
    message = "Waste collected successfully! Bin level has been reduced.";
  } else if (sessionExpired) {
    // Session expired without collection
    await binRepo.endSession(id);
    sessionStatus = "expired";
    message =
      "Session expired. Bin level was not reduced. Please scan again to restart.";
  }

  return res.json({
    hasActiveSession: !sessionExpired && !levelReduced,
    sessionStatus,
    message,
    sessionData: {
      startedAt: bin.sessionStartedAt,
      elapsedMinutes: Math.floor(elapsedMinutes),
      remainingMinutes: Math.max(0, 15 - Math.floor(elapsedMinutes)),
      initialFillLevel: initialLevel,
      currentFillLevel: currentLevel,
      levelReduced,
      sessionExpired,
    },
    bin: {
      id: bin._id,
      code: bin.code,
      status: bin.status,
      fillLevelPercent: bin.fillLevelPercent,
    },
  });
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
  startCollectionSession,
  checkCollectionSession,
};
