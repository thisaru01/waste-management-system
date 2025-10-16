import express from 'express';
import {
  getAllSettings,
  getProfile,
  updateProfile,
  getNotificationPreferences,
  updateNotificationPreferences,
  changePassword,
} from '../../controllers/residentController/settings.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.get('/', authenticate, getAllSettings);
router.get('/profile', authenticate, getProfile);
router.patch('/profile', authenticate, updateProfile);
router.get('/notifications', authenticate, getNotificationPreferences);
router.patch('/notifications', authenticate, updateNotificationPreferences);
router.post('/password', authenticate, changePassword);

export default router;
