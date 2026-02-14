import bcrypt from 'bcryptjs';
import { connectDb, disconnectDb } from '../config/db.js';
import { getAdminCollection } from '../models/Admin.js';

const DEFAULT_EMAIL = 'admin@acousticsfx.com';
const DEFAULT_PASSWORD = 'acoustic1234';

async function seed(): Promise<void> {
  await connectDb();

  const admins = getAdminCollection();
  const existing = await admins.findOne({ email: DEFAULT_EMAIL });

  if (existing) {
    console.log('Admin user already exists:', DEFAULT_EMAIL);
    await disconnectDb();
    process.exit(0);
    return;
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  await admins.insertOne({
    email: DEFAULT_EMAIL,
    passwordHash,
    role: 'super_admin',
    createdAt: new Date(),
  });

  console.log('Created admin user:', DEFAULT_EMAIL);
  await disconnectDb();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
