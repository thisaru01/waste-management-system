import { ValidationError } from './errors.js';

/**
 * Pickup validation utilities
 * Follows Single Responsibility Principle - only validates pickup data
 */

export class PickupValidator {
  /**
   * Validate pickup date is in the future
   */
  static validateFutureDate(date) {
    const pickupDate = new Date(date);
    const now = new Date();
    
    // Reset time to start of day for fair comparison
    now.setHours(0, 0, 0, 0);
    pickupDate.setHours(0, 0, 0, 0);
    
    if (pickupDate < now) {
      throw new ValidationError('Pickup date must be today or in the future');
    }
    
    return pickupDate;
  }

  /**
   * Validate required fields for scheduling
   */
  static validateScheduleData({ date, itemType, itemWeight }) {
    const errors = [];

    if (!date) errors.push('Date is required');
    if (!itemType || itemType.trim() === '') errors.push('Item type is required');
    if (!itemWeight || itemWeight.trim() === '') errors.push('Item weight is required');

    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '));
    }
  }

  /**
   * Validate pickup status
   */
  static validateStatus(status) {
    const validStatuses = ['scheduled', 'in-progress', 'completed', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      throw new ValidationError(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      );
    }
    
    return status;
  }

  /**
   * Validate if pickup can be modified
   */
  static canModifyPickup(pickup) {
    const nonModifiableStatuses = ['completed', 'cancelled'];
    
    if (nonModifiableStatuses.includes(pickup.status)) {
      throw new ValidationError(
        `Cannot modify ${pickup.status} pickups`
      );
    }
    
    return true;
  }

  /**
   * Validate update data contains only allowed fields
   */
  static sanitizeUpdateData(updateData) {
    const allowedFields = ['date', 'itemType', 'itemWeight', 'notes'];
    const sanitized = {};

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        sanitized[field] = updateData[field];
      }
    });

    return sanitized;
  }
}

export default PickupValidator;
