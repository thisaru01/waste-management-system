import authService from '../services/auth.service.js';

export const authenticate = (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.substring(7) : null;
    if (!token) return res.status(401).json({ message: 'Missing token' });
    const payload = authService.verifyToken(token);
    req.user = payload; // { sub, email, roles }
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const authorize = (...requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const userRoles = new Set(req.user.roles || []);
    const ok = requiredRoles.some((r) => userRoles.has(r.toLowerCase()));
    if (!ok) return res.status(403).json({ message: 'Forbidden' });
    return next();
  };
};
