import express from 'express';
import collectionController from '../controllers/collection.controller.js';

const router = express.Router();

// GET /api/collections/trend?date=YYYY-MM-DD
router.get('/trend', collectionController.getTrendByDate);

// POST /api/collections/seed - seed sample records
router.post('/seed', collectionController.seedToday);

export default router;
