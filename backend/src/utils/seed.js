import roleRepo from '../repositories/role.repository.js';
import userRepo from '../repositories/user.repository.js';
import User from '../models/user.model.js';

const DEFAULT_ROLES = [
  { name: 'admin', displayName: 'Admin', description: 'System administrator', isSystem: true },
  { name: 'authority', displayName: 'Authority', description: 'Municipal/Authority role', isSystem: true },
  { name: 'analysis', displayName: 'Analysis', description: 'Analytics role', isSystem: true },
  { name: 'bin-owner', displayName: 'Bin Owner', description: 'Bin owner role', isSystem: false },
  { name: 'collector', displayName: 'Collector', description: 'Collector role', isSystem: false },
];

export async function seedDefaults() {
  // Seed roles
  for (const r of DEFAULT_ROLES) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await roleRepo.findByName(r.name);
    if (!existing) {
      // eslint-disable-next-line no-await-in-loop
      await roleRepo.create(r);
    }
  }

  // Seed admin
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';
  const existingAdmin = await userRepo.findByEmail(adminEmail);
  if (!existingAdmin) {
    const adminRole = await roleRepo.findByName('admin');
    const passwordHash = await User.hashPassword(adminPassword);
    await userRepo.create({
      email: adminEmail,
      passwordHash,
      firstName: 'System',
      lastName: 'Admin',
      roles: [adminRole._id],
    });
    // eslint-disable-next-line no-console
    console.log(`Seeded admin user: ${adminEmail}`);
  }
}
