import userRepo from '../repositories/user.repository.js';
import roleRepo from '../repositories/role.repository.js';
import User from '../models/user/user.model.js';

export class UserService {
  async createUser({ email, password, firstName, lastName, roleNames = [] }) {
    const existing = await userRepo.findByEmail(email);
    if (existing) throw new Error('Email already in use');

    const roles = [];
    for (const name of roleNames) {
      const role = await roleRepo.findByName(name);
      if (!role) throw new Error(`Role not found: ${name}`);
      roles.push(role._id);
    }

    const passwordHash = await User.hashPassword(password);
    const created = await userRepo.create({ email, passwordHash, firstName, lastName, roles });
    return created;
  }

  async listUsers() {
    return userRepo.list();
  }
}

export default new UserService();
