/**
 * One-off: set role to super_admin for any admin that does not have a role.
 * Run with: npx tsx src/scripts/migrateAdminRoles.ts
 */
import { connectDb, disconnectDb } from '../config/db.js';
import { getAdminCollection } from '../models/Admin.js';

async function migrate(): Promise<void> {
  await connectDb();
  const admins = getAdminCollection();
  const result = await admins.updateMany(
    { role: { $exists: false } },
    { $set: { role: 'super_admin' } }
  );
  console.log('Migrated admins (role set to super_admin):', result.modifiedCount);
  await disconnectDb();
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
