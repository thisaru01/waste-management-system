import express from 'express';
import piController from '../controllers/pi.controller.js';

const router = express.Router();

// GET /api/pi - fetch all PI metrics as a key-value map
router.get('/', piController.getAll);

// POST /api/pi/seed - seed PI metrics (body is key-value map)
router.post('/seed', piController.seed);

export default router;
