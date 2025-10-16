import settingsService from '../../services/settings.service.js';

/**
 * Settings Controller
 * Follows Single Responsibility Principle - handles HTTP for user settings operations only
 */

/**
 * Get user profile settings
 * @route GET /api/settings/profile
 */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.sub;

    const profile = await settingsService.getUserProfile(userId);
    return res.json(profile);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      message: err.message,
      error: err.name,
    });
  }
};

/**
 * Update user profile
 * @route PATCH /api/settings/profile
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.sub;
    const profileData = req.body;

    const updatedProfile = await settingsService.updateProfile(userId, profileData);
    return res.json(updatedProfile);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      message: err.message,
      error: err.name,
    });
  }
};

/**
 * Get notification preferences
 * @route GET /api/settings/notifications
 */
export const getNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.sub;

    const profile = await settingsService.getUserProfile(userId);
    return res.json({
      emailNotifications: profile.emailNotifications,
      smsNotifications: profile.smsNotifications,
      inAppNotifications: profile.inAppNotifications,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      message: err.message,
      error: err.name,
    });
  }
};

/**
 * Update notification preferences
 * @route PATCH /api/settings/notifications
 */
export const updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.sub;
    const preferences = req.body;

    const updatedPreferences = await settingsService.updateNotificationPreferences(
      userId,
      preferences
    );
    return res.json(updatedPreferences);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      message: err.message,
      error: err.name,
    });
  }
};

/**
 * Change password
 * @route POST /api/settings/password
 */
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.sub;
    const passwordData = req.body;

    const result = await settingsService.changePassword(userId, passwordData);
    return res.json(result);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      message: err.message,
      error: err.name,
    });
  }
};

/**
 * Get all settings
 * @route GET /api/settings
 */
export const getAllSettings = async (req, res) => {
  try {
    const userId = req.user.sub;

    const settings = await settingsService.getAllSettings(userId);
    return res.json(settings);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      message: err.message,
      error: err.name,
    });
  }
};
