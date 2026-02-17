/**
 * Idempotent trusted partners seed: skips if any already exist.
 * Run: npx tsx src/scripts/seedTrustedPartners.ts  (or npm run seed:trusted-partners)
 */
import { connectDb, disconnectDb } from '../config/db.js';
import { getTrustedPartnerCollection } from '../models/TrustedPartner.js';
import type { TrustedPartner } from '../types/index.js';

const DEFAULT_PARTNERS: Omit<TrustedPartner, '_id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'REET Global Advisors', logo: '/assets/about/image 7.png', order: 1 },
  { name: 'Pidilite', logo: '/assets/about/image 5 (1).png', order: 2 },
  { name: 'Goldman Sachs', logo: '/assets/about/image 3.png', order: 3 },
  { name: 'Norwest Venture Partners', logo: '/assets/about/image 1 (1).png', order: 4 },
  { name: 'BI', logo: '/assets/about/image 2.png', order: 5 },
];

async function seed(): Promise<void> {
  await connectDb();

  const coll = getTrustedPartnerCollection();
  const existing = await coll.countDocuments();

  if (existing > 0) {
    console.log(`Trusted partners seed skipped: ${existing} already exist.`);
    await disconnectDb();
    process.exit(0);
    return;
  }

  const now = new Date();
  const docs: TrustedPartner[] = DEFAULT_PARTNERS.map((p) => ({
    ...p,
    createdAt: now,
    updatedAt: now,
  }));

  const result = await coll.insertMany(docs);
  console.log(`Trusted partners seed done. Inserted: ${result.insertedCount}`);
  await disconnectDb();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Trusted partners seed failed:', err);
  process.exit(1);
});
