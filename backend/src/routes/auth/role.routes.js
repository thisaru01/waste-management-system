import { Router } from "express";
import {
  createRole,
  listRoles,
} from "../../controllers/admin/role.controller.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";

const router = Router();

// Allow listing roles without authentication (useful for public/initial UI forms).
router.get("/", listRoles);
// Creating roles stays protected to admin users only.
router.post("/", authenticate, authorize("admin"), createRole);

export default router;
