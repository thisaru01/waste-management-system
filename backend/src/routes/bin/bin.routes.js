import { Router } from "express";
import {
  listBins,
  updateBinSensor,
  listFlagged,
  listUnauthorized,
} from "../../controllers/bin/bin.controller.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";

const router = Router();

// Admins can list bins and perform sensor updates (simulation)
router.get("/", authenticate, authorize("admin"), listBins);
router.patch("/:id/sensor", authenticate, authorize("admin"), updateBinSensor);

// Authenticated users can fetch flagged bins (public-facing)
router.get("/flagged", authenticate, listFlagged);

// Authority users can view unauthorized collection alerts
router.get(
  "/unauthorized",
  authenticate,
  authorize("authority"),
  listUnauthorized
);

export default router;
