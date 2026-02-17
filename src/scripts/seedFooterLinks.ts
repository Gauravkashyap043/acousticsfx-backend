import { connectDb, disconnectDb } from '../config/db.js';
import { getFooterLinkCollection } from '../models/FooterLink.js';
import type { FooterLink } from '../types/index.js';

const DEFAULTS: Omit<FooterLink, '_id' | 'createdAt' | 'updatedAt'>[] = [
  { section: 'services', label: 'Acoustic Solution', order: 1 },
  { section: 'services', label: 'Sound Proofing', order: 2 },
  { section: 'services', label: 'Floor Solution', order: 3 },
  { section: 'resources', label: 'Case Study', href: '/resources/casestudy', order: 1 },
  { section: 'resources', label: 'Careers', order: 2 },
  { section: 'resources', label: 'FX Acoustic In News', order: 3 },
  { section: 'resources', label: 'Blogs', href: '/resources/blogs', order: 4 },
];

async function seed(): Promise<void> {
  await connectDb();
  const coll = getFooterLinkCollection();
  const existing = await coll.countDocuments();
  if (existing > 0) {
    console.log(`Footer links seed skipped: ${existing} already exist.`);
    await disconnectDb(); process.exit(0); return;
  }
  const now = new Date();
  const docs: FooterLink[] = DEFAULTS.map((d) => ({ ...d, createdAt: now, updatedAt: now }));
  const result = await coll.insertMany(docs);
  console.log(`Footer links seed done. Inserted: ${result.insertedCount}`);
  await disconnectDb(); process.exit(0);
}

seed().catch((err) => { console.error('Footer links seed failed:', err); process.exit(1); });
