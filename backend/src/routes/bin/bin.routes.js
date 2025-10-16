import { Router } from "express";
import {
  listBins,
  updateBinSensor,
  listFlagged,
  listAssignedForMe,
  assignCollector,
  clearAssignment,
  getBinByCode,
  markAsCollected,
} from "../../controllers/bin/bin.controller.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";

const router = Router();

// Admins can list bins and perform sensor updates (simulation)
router.get("/", authenticate, authorize("admin"), listBins);
router.patch("/:id/sensor", authenticate, authorize("admin"), updateBinSensor);
router.patch(
  "/:id/assign",
  authenticate,
  authorize("authority"),
  assignCollector
);
router.patch(
  "/:id/unassign",
  authenticate,
  authorize("authority"),
  clearAssignment
);

// Authenticated users can fetch flagged bins (public-facing)
router.get("/flagged", authenticate, listFlagged);
// Collectors can list their assigned bins
router.get(
  "/assigned",
  authenticate,
  authorize("collector"),
  listAssignedForMe
);
// Collectors can get bin by code (for QR scanning)
router.get("/code/:code", authenticate, authorize("collector"), getBinByCode);
// Collectors can mark bins as collected
router.patch(
  "/:id/collect",
  authenticate,
  authorize("collector"),
  markAsCollected
);

export default router;
