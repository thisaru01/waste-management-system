import User from '../models/user/user.model.js';

export class UserRepository {
  async findByEmail(email, includePassword = false) {
    const query = User.findOne({ email: email.toLowerCase() });
    if (includePassword) query.select('+passwordHash');
    return query.populate('roles');
  }

  async create(user, options) {
    if (options?.session) {
      const doc = new User(user);
      await doc.save(options);
      return doc;
    }
    return User.create(user);
  }

  async list(filter = {}, projection = '-passwordHash') {
    return User.find(filter, projection).populate('roles').lean();
  }

  async updateLastLogin(userId) {
    return User.findByIdAndUpdate(userId, { lastLoginAt: new Date() }, { new: true });
  }
}

export default new UserRepository();
