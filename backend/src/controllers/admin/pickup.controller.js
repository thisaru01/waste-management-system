import pickupService from '../../services/pickup.service.js';

/**
 * Admin Pickup Controller
 * Follows Single Responsibility Principle - handles HTTP for admin pickup operations only
 */

/**
 * Get all pickups (Admin)
 * @route GET /api/admin/pickups
 */
export const listAllPickups = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const pickups = await pickupService.listAllPickups(filter);
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
 * Update pickup status (Admin)
 * @route PATCH /api/admin/pickups/:id/status
 */
export const updatePickupStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const pickup = await pickupService.updatePickupStatus(id, status);
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
 * Get pickup by ID (Admin)
 * @route GET /api/admin/pickups/:id
 */
export const getPickupById = async (req, res) => {
  try {
    const { id } = req.params;
    const pickup = await pickupService.getPickupById(id);
    return res.json(pickup);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ 
      message: err.message,
      error: err.name 
    });
  }
};
