import binRepo from "../../repositories/bin.repository.js";

function getSessionDurationMinutes() {
  const raw = process.env.COLLECTION_SESSION_MINUTES;
  const n = raw !== undefined ? Number(raw) : 15;
  return Number.isFinite(n) && n > 0 ? n : 15;
}

/**
 * POST /api/collections/:id/start-session
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

  const duration = getSessionDurationMinutes();
  return res.json({
    ...updated.toObject(),
    sessionDurationMinutes: duration,
    message: `Collection session started. You have ${duration} minute(s) to collect waste.`,
  });
};

/**
 * GET /api/collections/:id/check-session
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
  const duration = getSessionDurationMinutes();
  const sessionExpired = elapsedMinutes > duration;

  // Check if fill level has been reduced
  const initialLevel = bin.sessionInitialFillLevel || 0;
  const currentLevel = bin.fillLevelPercent || 0;
  const thresholdMet = currentLevel <= 5; // Only finalize when <= 5%

  let sessionStatus = "active";
  let message = "Session is active. Monitoring bin level...";
  let updatedStatus = bin.status;

  if (thresholdMet) {
    // Bin level meets threshold - mark as collected and end session
    await binRepo.updateSensor(id, {
      status: "collected",
    });
    await binRepo.endSession(id);

    sessionStatus = "completed";
    message = "Waste collected successfully! Bin level is 5% or below.";
    updatedStatus = "collected";
  } else if (sessionExpired) {
    // Session expired without collection
    await binRepo.updateSensor(id, { status: "assigned" });
    await binRepo.endSession(id);
    sessionStatus = "expired";
    message =
      "Session expired. Bin level was not reduced. Please scan again to restart.";
    updatedStatus = "assigned";
  }

  return res.json({
    hasActiveSession: !sessionExpired && !thresholdMet,
    sessionStatus,
    message,
    sessionData: {
      startedAt: bin.sessionStartedAt,
      elapsedMinutes: Math.floor(elapsedMinutes),
      remainingMinutes: Math.max(0, Math.ceil(duration - elapsedMinutes)),
      sessionDurationMinutes: duration,
      initialFillLevel: initialLevel,
      currentFillLevel: currentLevel,
      thresholdMet,
      sessionExpired,
    },
    bin: {
      id: bin._id,
      code: bin.code,
      status: updatedStatus,
      fillLevelPercent: bin.fillLevelPercent,
    },
  });
};

export default {
  startCollectionSession,
  checkCollectionSession,
};
