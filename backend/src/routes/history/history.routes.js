import { Router } from "express";
import {
  finishTodaySchedule,
  listMyHistory,
  listAllHistory,
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

// Authority can list all history
router.get("/", authenticate, authorize("authority"), listAllHistory);

export default router;
