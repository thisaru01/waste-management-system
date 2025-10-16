import roleRepo from '../repositories/role.repository.js';
import userRepo from '../repositories/user.repository.js';
import User from '../models/user/user.model.js';
import binRepo from '../repositories/bin.repository.js';

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

  // Seed sample bins (for simulation/demo)
  const existingBins = await binRepo.list();
  if (!existingBins || existingBins.length === 0) {
    const samples = [
      { code: 'PUB-001', type: 'public', capacityLiters: 120, location: { description: 'Main Street & 1st Ave' }, fillLevelPercent: 12, weightKg: 3.5 },
      { code: 'PUB-002', type: 'public', capacityLiters: 240, location: { description: 'Central Park North Gate' }, fillLevelPercent: 86, weightKg: 12.1 },
      { code: 'HOU-ACME-01', type: 'household', capacityLiters: 120, location: { description: '42 Galaxy Road' }, fillLevelPercent: 45, weightKg: 6.2 },
    ];
    for (const s of samples) {
      // eslint-disable-next-line no-await-in-loop
      await binRepo.create(s);
    }
    console.log('Seeded sample bins');
  }
}
