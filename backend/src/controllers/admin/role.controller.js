import roleRepo from '../../repositories/role.repository.js';

export const listRoles = async (_req, res) => {
  const roles = await roleRepo.list();
  return res.json(roles);
};

export const createRole = async (req, res) => {
  try {
    const { name, displayName, description, permissions } = req.body;
    if (!name || !displayName) return res.status(400).json({ message: 'name and displayName are required' });
    const existing = await roleRepo.findByName(name);
    if (existing) return res.status(409).json({ message: 'Role already exists' });
    const created = await roleRepo.create({
      name: name.toLowerCase(),
      displayName,
      description,
      permissions: Array.isArray(permissions) ? permissions : [],
    });
    return res.status(201).json(created);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};
