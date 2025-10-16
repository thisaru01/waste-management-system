import { ValidationError } from './errors.js';

/**
 * Settings Validator
 * Follows Single Responsibility Principle - only validates settings data
 * Centralizes validation logic following DRY principle
 */
class SettingsValidator {
  /**
   * Validate profile update data
   */
  static validateProfileData(data) {
    const { firstName, lastName, address, phone } = data;

    if (firstName !== undefined) {
      if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
        throw new ValidationError('First name is required and must be a non-empty string');
      }
      if (firstName.trim().length > 50) {
        throw new ValidationError('First name must not exceed 50 characters');
      }
    }

    if (lastName !== undefined) {
      if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0) {
        throw new ValidationError('Last name is required and must be a non-empty string');
      }
      if (lastName.trim().length > 50) {
        throw new ValidationError('Last name must not exceed 50 characters');
      }
    }

    if (address !== undefined && address !== null) {
      if (typeof address !== 'string') {
        throw new ValidationError('Address must be a string');
      }
      if (address.trim().length > 200) {
        throw new ValidationError('Address must not exceed 200 characters');
      }
    }

    if (phone !== undefined && phone !== null) {
      if (typeof phone !== 'string') {
        throw new ValidationError('Phone must be a string');
      }
      // Allow empty phone (user might not want to provide it)
      if (phone.trim().length > 0) {
        // Basic phone validation (can be customized)
        const phoneRegex = /^[0-9+\-() ]{7,20}$/;
        if (!phoneRegex.test(phone.trim())) {
          throw new ValidationError('Invalid phone number format');
        }
      }
    }

    return true;
  }

  /**
   * Validate notification preferences
   */
  static validateNotificationPreferences(preferences) {
    const { emailNotifications, smsNotifications, inAppNotifications } = preferences;

    if (emailNotifications !== undefined && typeof emailNotifications !== 'boolean') {
      throw new ValidationError('Email notifications must be a boolean');
    }

    if (smsNotifications !== undefined && typeof smsNotifications !== 'boolean') {
      throw new ValidationError('SMS notifications must be a boolean');
    }

    if (inAppNotifications !== undefined && typeof inAppNotifications !== 'boolean') {
      throw new ValidationError('In-app notifications must be a boolean');
    }

    return true;
  }

  /**
   * Validate password change data
   */
  static validatePasswordChange(data) {
    const { currentPassword, newPassword, confirmPassword } = data;

    if (!currentPassword || typeof currentPassword !== 'string') {
      throw new ValidationError('Current password is required');
    }

    if (!newPassword || typeof newPassword !== 'string') {
      throw new ValidationError('New password is required');
    }

    if (!confirmPassword || typeof confirmPassword !== 'string') {
      throw new ValidationError('Confirm password is required');
    }

    // Password strength validation
    if (newPassword.length < 8) {
      throw new ValidationError('New password must be at least 8 characters long');
    }

    if (newPassword.length > 100) {
      throw new ValidationError('New password must not exceed 100 characters');
    }

    // Check password complexity
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      throw new ValidationError(
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      );
    }

    // Check passwords match
    if (newPassword !== confirmPassword) {
      throw new ValidationError('New password and confirm password do not match');
    }

    // Check new password is different from current
    if (currentPassword === newPassword) {
      throw new ValidationError('New password must be different from current password');
    }

    return true;
  }

  /**
   * Sanitize profile update data
   */
  static sanitizeProfileData(data) {
    const allowed = ['firstName', 'lastName', 'address', 'phone'];
    const sanitized = {};

    for (const key of allowed) {
      if (data[key] !== undefined) {
        sanitized[key] = typeof data[key] === 'string' ? data[key].trim() : data[key];
      }
    }

    return sanitized;
  }

  /**
   * Sanitize notification preferences
   */
  static sanitizeNotificationPreferences(data) {
    const allowed = ['emailNotifications', 'smsNotifications', 'inAppNotifications'];
    const sanitized = {};

    for (const key of allowed) {
      if (data[key] !== undefined) {
        sanitized[key] = Boolean(data[key]);
      }
    }

    return sanitized;
  }
}

export default SettingsValidator;
