import { Router } from "express";
import {
  getBinByCode,
  markAsCollected,
} from "../../controllers/collection/collection.controller.js";
import {
  startCollectionSession,
  checkCollectionSession,
} from "../../controllers/session/session.controller.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";

const router = Router();

// Collectors can get bin by code (for QR scanning)
router.get("/code/:code", authenticate, authorize("collector"), getBinByCode);

// Collectors can mark bins as collected
router.patch(
  "/:id/collect",
  authenticate,
  authorize("collector"),
  markAsCollected
);

// Collectors can start a collection session
router.post(
  "/:id/start-session",
  authenticate,
  authorize("collector"),
  startCollectionSession
);

// Collectors can check session status
router.get(
  "/:id/check-session",
  authenticate,
  authorize("collector"),
  checkCollectionSession
);

export default router;
