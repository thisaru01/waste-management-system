import userService from '../../services/user.service.js';

export const createUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, roles, binLocation } = req.body;
    if (!email || !password || !Array.isArray(roles)) {
      return res.status(400).json({ message: 'email, password and roles[] are required' });
    }
    if (roles.includes('bin-owner') && (!binLocation || !String(binLocation).trim())) {
      return res.status(400).json({ message: 'binLocation is required for bin-owner users' });
    }
    const created = await userService.createUser({ email, password, firstName, lastName, roleNames: roles, binLocation });
    return res.status(201).json({ id: created._id, email: created.email });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

export const listUsers = async (_req, res) => {
  const users = await userService.listUsers();
  return res.json(users);
};
