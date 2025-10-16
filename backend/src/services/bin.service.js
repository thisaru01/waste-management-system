import mongoose from 'mongoose';
import binRepo from '../repositories/bin.repository.js';

function generateBinCode(prefix = 'HOU') {
  // Simple unique-ish code generator: PREFIX-YYYYMMDD-XXXX
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${ymd}-${rand}`;
}

export class BinService {
  /**
   * Create a bin for an owner (household/business). Defaults to household with 120L capacity.
   * @param {{ ownerId: string, locationDescription: string, type?: 'household'|'business', capacityLiters?: number, session?: mongoose.ClientSession }} params
   */
  async createOwnerBin({ ownerId, locationDescription, type = 'household', capacityLiters = 120, session } = {}) {
    if (!ownerId) throw new Error('ownerId is required to create a bin');
    const code = generateBinCode(type === 'business' ? 'BUS' : 'HOU');
    const doc = {
      code,
      type,
      capacityLiters,
      owner: new mongoose.Types.ObjectId(ownerId),
      location: { description: locationDescription || '' },
      fillLevelPercent: 0,
      weightKg: 0,
      lastReadingAt: new Date(),
    };
    return binRepo.create(doc, session ? { session } : undefined);
  }
}

export default new BinService();
