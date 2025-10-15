import jwt from 'jsonwebtoken';
import userRepo from '../repositories/user.repository.js';

const ACCESS_TOKEN_TTL = '1d'; // can be configured via env later

export class AuthService {
  constructor({ jwtSecret }) {
    this.jwtSecret = jwtSecret;
  }

  async login({ email, password }) {
    const user = await userRepo.findByEmail(email, true);
    if (!user || !user.isActive) {
      throw new Error('Invalid credentials');
    }
    const ok = await user.comparePassword(password);
    if (!ok) {
      throw new Error('Invalid credentials');
    }

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      roles: user.roles.map((r) => r.name),
    };
    const token = jwt.sign(payload, this.jwtSecret, { expiresIn: ACCESS_TOKEN_TTL });
    await userRepo.updateLastLogin(user._id);

    return {
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles.map((r) => ({ name: r.name, displayName: r.displayName })),
      },
    };
  }

  verifyToken(token) {
    return jwt.verify(token, this.jwtSecret);
  }
}

export default new AuthService({ jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_me' });
