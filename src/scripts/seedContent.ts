/**
 * Idempotent content seed: inserts default key-value entries only when the key does not exist.
 * Safe to run multiple times; does not overwrite existing CMS-edited values.
 * Run: npx tsx src/scripts/seedContent.ts  (or npm run seed:content)
 */
import { connectDb, disconnectDb } from '../config/db.js';
import { getContentCollection } from '../models/Content.js';
import type { ContentType } from '../types/index.js';

interface SeedEntry {
  key: string;
  value: string;
  type?: ContentType;
}

const DEFAULT_CONTENT: SeedEntry[] = [
  {
    key: 'home.hero.title',
    value:
      'We take pride in building stylish and featured acoustic solution.',
    type: 'text',
  },
  {
    key: 'home.hero.subtitle',
    value:
      'Our solutions are engineered for clarity, comfort, and visual harmony. Whether it\'s a studio, auditorium, or workspace, we bring together design precision and acoustic mastery to elevate every square foot.',
    type: 'text',
  },
  {
    key: 'home.hero.backgroundImage',
    value: '/assets/home/background.png',
    type: 'image',
  },
  {
    key: 'about.hero.heading',
    value: 'Partner in Future Readiness',
    type: 'text',
  },
  {
    key: 'about.hero.subtitle',
    value:
      'Empowering tomorrow\'s spaces with acoustic solutions that blend precision, elegance, and performance.',
    type: 'text',
  },
  {
    key: 'about.hero.backgroundImage',
    value:
      "/assets/about/empty-flat-interrior-with-elements-decoration 1 (1).png",
    type: 'image',
  },
];

async function seed(): Promise<void> {
  await connectDb();

  const coll = getContentCollection();
  let inserted = 0;
  let skipped = 0;

  for (const entry of DEFAULT_CONTENT) {
    const existing = await coll.findOne({ key: entry.key });
    if (existing) {
      skipped++;
      continue;
    }
    await coll.insertOne({
      key: entry.key,
      value: entry.value,
      type: entry.type ?? 'text',
      updatedAt: new Date(),
    });
    inserted++;
  }

  console.log(
    `Content seed done. Inserted: ${inserted}, skipped (already present): ${skipped}`
  );
  await disconnectDb();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Content seed failed:', err);
  process.exit(1);
});
