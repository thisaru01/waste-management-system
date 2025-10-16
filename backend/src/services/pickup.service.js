import pickupRepo from '../repositories/pickup.repository.js';
import PickupValidator from '../utils/pickupValidator.js';
import { NotFoundError, UnauthorizedError, BusinessRuleError } from '../utils/errors.js';
import paymentService from './payment.service.js';

/**
 * Pickup Service
 * Follows SOLID Principles:
 * - Single Responsibility: Only handles pickup business logic
 * - Open/Closed: Can extend without modifying existing code
 * - Dependency Inversion: Depends on repository abstraction
 */
export class PickupService {
  /**
   * Schedule a new pickup for a resident
   * @param {Object} data - Pickup data
   * @returns {Promise<Object>} Created pickup with payment
   */
  async schedulePickup({ residentId, date, itemType, itemWeight, notes }) {
    // Validate required fields
    PickupValidator.validateScheduleData({ date, itemType, itemWeight });
    
    // Validate date is in the future
    const pickupDate = PickupValidator.validateFutureDate(date);

    // Create pickup
    const pickup = await pickupRepo.create({
      resident: residentId,
      date: pickupDate,
      itemType: itemType.trim(),
      itemWeight: itemWeight.trim(),
      notes: notes?.trim() || '',
      status: 'scheduled',
    });

    // Get pickup fee from environment or use default
    const pickupFee = parseFloat(process.env.PICKUP_FEE) || 25.00;

    // Create payment for the pickup
    const payment = await paymentService.createPickupPayment({
      residentId,
      pickupId: pickup._id,
      amount: pickupFee,
      description: `Scheduled pickup - ${itemType}`,
    });

    // Return pickup with payment information
    return {
      ...pickup,
      payment: {
        id: payment._id,
        amount: payment.amount,
        status: payment.status,
        invoiceNumber: payment.invoiceNumber,
      },
    };
  }

  /**
   * Get all pickups for a specific resident
   */
  async getResidentPickups(residentId, status = null) {
    const filter = status ? { status } : {};
    return pickupRepo.findByResident(residentId, filter);
  }

  /**
   * Get all pickups (admin)
   */
  async listAllPickups(filter = {}) {
    return pickupRepo.list(filter);
  }

  /**
   * Get pickup by ID
   * @param {string} id - Pickup ID
   * @returns {Promise<Object>} Pickup object
   * @throws {NotFoundError} If pickup not found
   */
  async getPickupById(id) {
    const pickup = await pickupRepo.findById(id);
    
    if (!pickup) {
      throw new NotFoundError('Pickup');
    }
    
    return pickup;
  }

  /**
   * Update pickup status
   * @param {string} id - Pickup ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated pickup
   */
  async updatePickupStatus(id, status) {
    // Validate status
    PickupValidator.validateStatus(status);

    // Update pickup
    const pickup = await pickupRepo.updateStatus(id, status);
    
    if (!pickup) {
      throw new NotFoundError('Pickup');
    }
    
    return pickup;
  }

  /**
   * Update pickup details (resident can update their own pickup if not completed)
   * @param {string} id - Pickup ID
   * @param {string} residentId - Resident ID
   * @param {Object} updateData - Fields to update
   * @returns {Promise<Object>} Updated pickup
   */
  async updatePickup(id, residentId, updateData) {
    // Get pickup
    const pickup = await this.getPickupById(id);

    // Verify ownership
    if (pickup.resident._id.toString() !== residentId.toString()) {
      throw new UnauthorizedError('You can only update your own pickups');
    }

    // Check if pickup can be modified
    PickupValidator.canModifyPickup(pickup);

    // Sanitize update data (only allowed fields)
    const sanitizedData = PickupValidator.sanitizeUpdateData(updateData);

    // Validate date if being updated
    if (sanitizedData.date) {
      sanitizedData.date = PickupValidator.validateFutureDate(sanitizedData.date);
    }

    // Trim string fields
    if (sanitizedData.itemType) sanitizedData.itemType = sanitizedData.itemType.trim();
    if (sanitizedData.itemWeight) sanitizedData.itemWeight = sanitizedData.itemWeight.trim();
    if (sanitizedData.notes) sanitizedData.notes = sanitizedData.notes.trim();

    // Update pickup
    return pickupRepo.update(id, sanitizedData);
  }

  /**
   * Cancel a pickup (resident can cancel their own)
   * @param {string} id - Pickup ID
   * @param {string} residentId - Resident ID
   * @returns {Promise<Object>} Cancelled pickup with refund info
   */
  async cancelPickup(id, residentId) {
    // Get pickup
    const pickup = await this.getPickupById(id);

    // Verify ownership
    if (pickup.resident._id.toString() !== residentId.toString()) {
      throw new UnauthorizedError('You can only cancel your own pickups');
    }

    // Cannot cancel completed pickups
    if (pickup.status === 'completed') {
      throw new BusinessRuleError('Cannot cancel completed pickups');
    }

    // Cannot cancel already cancelled pickups
    if (pickup.status === 'cancelled') {
      throw new BusinessRuleError('Pickup is already cancelled');
    }

    // Update status to cancelled
    const cancelledPickup = await pickupRepo.updateStatus(id, 'cancelled');

    // Process refund for the associated payment
    let refundInfo = null;
    try {
      refundInfo = await paymentService.processPickupCancellationRefund(id, 'Pickup cancelled by resident');
      console.log('✅ Refund processed successfully:', refundInfo);
    } catch (error) {
      // Log error with more details
      console.error('❌ Failed to process refund:', error);
      console.error('Error details:', {
        pickupId: id,
        errorMessage: error.message,
        errorName: error.name,
        stack: error.stack
      });
      
      // Still return error info to user
      refundInfo = {
        status: 'error',
        message: `Failed to process refund: ${error.message}`,
        error: error.name
      };
    }

    return {
      ...cancelledPickup,
      refund: refundInfo,
    };
  }
}

export default new PickupService();
