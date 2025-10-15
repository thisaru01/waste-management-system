import authService from '../services/auth.service.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
    const result = await authService.login({ email, password });
    return res.json(result);
  } catch (err) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
};
