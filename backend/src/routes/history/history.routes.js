import { Router } from "express";
import {
  finishTodaySchedule,
  listMyHistory,
} from "../../controllers/history/history.controller.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";

const router = Router();

// Collector finishes today's schedule and persists a history snapshot
router.post(
  "/finish-today",
  authenticate,
  authorize("collector"),
  finishTodaySchedule
);

// Collector can list their own history
router.get("/my", authenticate, authorize("collector"), listMyHistory);

export default router;
