import Role from '../models/role/role.model.js';

export class RoleRepository {
  async findByName(name) {
    return Role.findOne({ name: name.toLowerCase() });
  }

  async create(role) {
    return Role.create(role);
  }

  async list() {
    return Role.find().sort({ displayName: 1 }).lean();
  }
}

export default new RoleRepository();
