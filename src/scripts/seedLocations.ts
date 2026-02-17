import { connectDb, disconnectDb } from '../config/db.js';
import { getLocationCollection } from '../models/Location.js';
import type { Location } from '../types/index.js';

const DEFAULTS: Omit<Location, '_id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Corporate Office',
    highlight: true,
    order: 1,
    items: [
      { label: 'Location', value: '3688, Sector 46-C, Chandigarh-160047. INDIA.' },
      { label: 'Email', value: 'sales@acousticsfx.com' },
      { label: 'Phone', value: '+91 9967 034 958' },
    ],
  },
  {
    title: 'Factory',
    highlight: false,
    order: 2,
    items: [
      { label: 'Location', value: '347-350B, HSIIDC Industrial Estate, Saha, Haryana-133104. INDIA.' },
      { label: 'Email', value: 'sales@acousticsfx.com' },
      { label: 'Phone', value: '+91 8599 999 347, +91 9996 119 099' },
    ],
  },
  {
    title: 'Mumbai Office',
    highlight: false,
    order: 3,
    items: [
      { label: 'Location', value: 'Plot-5, A301 Indusagar, Sector-7, Dr. B.A. Road, Charkop, Kandivali (West), Mumbai-400 067, Maharashtra, INDIA.' },
      { label: 'Contact', value: 'Mr. Sunil Sawant' },
      { label: 'Phone', value: '+91 9967 034 958' },
    ],
  },
];

async function seed(): Promise<void> {
  await connectDb();
  const coll = getLocationCollection();
  const existing = await coll.countDocuments();
  if (existing > 0) {
    console.log(`Locations seed skipped: ${existing} already exist.`);
    await disconnectDb(); process.exit(0); return;
  }
  const now = new Date();
  const docs: Location[] = DEFAULTS.map((d) => ({ ...d, createdAt: now, updatedAt: now }));
  const result = await coll.insertMany(docs);
  console.log(`Locations seed done. Inserted: ${result.insertedCount}`);
  await disconnectDb(); process.exit(0);
}

seed().catch((err) => { console.error('Locations seed failed:', err); process.exit(1); });
