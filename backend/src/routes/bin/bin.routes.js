import { Router } from 'express';
import { listBins, updateBinSensor } from '../../controllers/bin/bin.controller.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

// Admins can list bins and perform sensor updates (simulation)
router.get('/', authenticate, authorize('admin'), listBins);
router.patch('/:id/sensor', authenticate, authorize('admin'), updateBinSensor);

export default router;
