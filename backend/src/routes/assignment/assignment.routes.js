import { Router } from "express";
import {
  listAssignedForMe,
  assignCollector,
  clearAssignment,
} from "../../controllers/assignment/assignment.controller.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";

const router = Router();

// Collectors can list their assigned bins
router.get(
  "/my-bins",
  authenticate,
  authorize("collector"),
  listAssignedForMe
);

// Authority can assign collectors to bins
router.patch(
  "/bins/:id/assign",
  authenticate,
  authorize("authority"),
  assignCollector
);

// Authority can unassign collectors from bins
router.patch(
  "/bins/:id/unassign",
  authenticate,
  authorize("authority"),
  clearAssignment
);

export default router;
