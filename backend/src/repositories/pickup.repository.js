import Pickup from '../models/pickup/pickup.model.js';

export class PickupRepository {
  async create(pickupData) {
    return Pickup.create(pickupData);
  }

  async findById(id) {
    return Pickup.findById(id).populate('resident', 'firstName lastName email').lean();
  }

  async findByResident(residentId, filter = {}) {
    return Pickup.find({ resident: residentId, ...filter })
      .sort({ date: -1 })
      .lean();
  }

  async list(filter = {}, projection = null) {
    return Pickup.find(filter, projection)
      .populate('resident', 'firstName lastName email')
      .sort({ date: -1 })
      .lean();
  }

  async updateStatus(id, status) {
    return Pickup.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).lean();
  }

  async update(id, updateData) {
    return Pickup.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).lean();
  }

  async delete(id) {
    return Pickup.findByIdAndDelete(id).lean();
  }
}

export default new PickupRepository();
