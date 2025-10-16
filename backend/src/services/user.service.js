import mongoose from 'mongoose';
import userRepo from '../repositories/user.repository.js';
import roleRepo from '../repositories/role.repository.js';
import User from '../models/user/user.model.js';
import binService from './bin.service.js';

export class UserService {
  async createUser({ email, password, firstName, lastName, roleNames = [], binLocation } = {}) {
    const existing = await userRepo.findByEmail(email);
    if (existing) throw new Error('Email already in use');

    const roles = [];
    let isBinOwner = false;
    for (const name of roleNames) {
      const role = await roleRepo.findByName(name);
      if (!role) throw new Error(`Role not found: ${name}`);
      if (role.name === 'bin-owner') isBinOwner = true;
      roles.push(role._id);
    }

    const passwordHash = await User.hashPassword(password);

    // Use transaction so user and bin are created atomically
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const created = await userRepo.create({ email, passwordHash, firstName, lastName, roles }, { session });

      if (isBinOwner) {
        await binService.createOwnerBin({ ownerId: created._id.toString(), locationDescription: binLocation, session });
      }

      await session.commitTransaction();
      session.endSession();
      return created;
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
  }

  async listUsers() {
    return userRepo.list();
  }
}

export default new UserService();
