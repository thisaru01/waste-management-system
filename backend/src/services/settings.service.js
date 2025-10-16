import userRepo from '../repositories/user.repository.js';
import SettingsValidator from '../utils/settingsValidator.js';
import { NotFoundError, UnauthorizedError, ValidationError } from '../utils/errors.js';
import User from '../models/user/user.model.js';

/**
 * Settings Service
 * Follows SOLID Principles:
 * - Single Responsibility: Only handles user settings business logic
 * - Open/Closed: Can extend without modifying existing code
 * - Dependency Inversion: Depends on repository abstraction
 */
export class SettingsService {
  /**
   * Get user profile
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User profile
   */
  async getUserProfile(userId) {
    const user = await userRepo.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User');
    }

    // Return only public profile data
    return {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      address: user.address || '',
      phone: user.phone || '',
      emailNotifications: user.emailNotifications ?? true,
      smsNotifications: user.smsNotifications ?? false,
      inAppNotifications: user.inAppNotifications ?? true,
    };
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated user profile
   */
  async updateProfile(userId, profileData) {
    // Validate and sanitize data
    const sanitizedData = SettingsValidator.sanitizeProfileData(profileData);
    SettingsValidator.validateProfileData(sanitizedData);

    // Update user
    const updatedUser = await userRepo.update(userId, sanitizedData);

    if (!updatedUser) {
      throw new NotFoundError('User');
    }

    return this.getUserProfile(userId);
  }

  /**
   * Update notification preferences
   * @param {string} userId - User ID
   * @param {Object} preferences - Notification preferences
   * @returns {Promise<Object>} Updated preferences
   */
  async updateNotificationPreferences(userId, preferences) {
    // Validate and sanitize preferences
    const sanitizedPreferences = SettingsValidator.sanitizeNotificationPreferences(preferences);
    SettingsValidator.validateNotificationPreferences(sanitizedPreferences);

    // Update user preferences
    const updatedUser = await userRepo.update(userId, sanitizedPreferences);

    if (!updatedUser) {
      throw new NotFoundError('User');
    }

    return {
      emailNotifications: updatedUser.emailNotifications,
      smsNotifications: updatedUser.smsNotifications,
      inAppNotifications: updatedUser.inAppNotifications,
    };
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {Object} passwordData - Password change data
   * @returns {Promise<Object>} Success message
   */
  async changePassword(userId, passwordData) {
    // Validate password data
    SettingsValidator.validatePasswordChange(passwordData);

    const { currentPassword, newPassword } = passwordData;

    // Get user with password hash
    const user = await userRepo.findById(userId, true);
    
    if (!user) {
      throw new NotFoundError('User');
    }

    // Verify current password
    const isValidPassword = await User.comparePasswords(currentPassword, user.passwordHash);
    
    if (!isValidPassword) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await User.hashPassword(newPassword);

    // Update password
    await userRepo.update(userId, { passwordHash: newPasswordHash });

    return { message: 'Password updated successfully' };
  }

  /**
   * Get user settings (all settings in one call)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} All user settings
   */
  async getAllSettings(userId) {
    return this.getUserProfile(userId);
  }
}

export default new SettingsService();
