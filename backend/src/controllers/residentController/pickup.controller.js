import pickupService from '../../services/pickup.service.js';

/**
 * Resident Pickup Controller
 * Follows Single Responsibility Principle - handles HTTP for resident pickup operations only
 */

/**
 * Schedule a new pickup (Resident)
 * @route POST /api/pickups
 */
export const schedulePickup = async (req, res, next) => {
  try {
    const { date, itemType, itemWeight, notes } = req.body;
    const residentId = req.user.sub; // from JWT token

    const pickup = await pickupService.schedulePickup({
      residentId,
      date,
      itemType,
      itemWeight,
      notes,
    });

    return res.status(201).json(pickup);
  } catch (err) {
    // Pass error to error handling middleware
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ 
      message: err.message,
      error: err.name 
    });
  }
};

/**
 * Get current user's pickups (Resident)
 * @route GET /api/pickups
 */
export const getMyPickups = async (req, res) => {
  try {
    const residentId = req.user.sub;
    const { status } = req.query;

    const pickups = await pickupService.getResidentPickups(residentId, status);
    return res.json(pickups);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ 
      message: err.message,
      error: err.name 
    });
  }
};

/**
 * Update pickup (Resident)
 * @route PATCH /api/pickups/:id
 */
export const updateMyPickup = async (req, res) => {
  try {
    const { id } = req.params;
    const residentId = req.user.sub;
    const updateData = req.body;

    const pickup = await pickupService.updatePickup(id, residentId, updateData);
    return res.json(pickup);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ 
      message: err.message,
      error: err.name 
    });
  }
};

/**
 * Cancel pickup (Resident)
 * @route PATCH /api/pickups/:id/cancel
 */
export const cancelMyPickup = async (req, res) => {
  try {
    const { id } = req.params;
    const residentId = req.user.sub;

    const pickup = await pickupService.cancelPickup(id, residentId);
    return res.json(pickup);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ 
      message: err.message,
      error: err.name 
    });
  }
};
