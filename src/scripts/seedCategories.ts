/**
 * Idempotent category seed: inserts default product categories when the collection is empty.
 * Run: npx tsx src/scripts/seedCategories.ts
 */
import { connectDb, disconnectDb } from '../config/db.js';
import { getCategoryCollection } from '../models/Category.js';
import type { ProductCategory } from '../types/index.js';

const DEFAULT_CATEGORIES: Omit<ProductCategory, '_id'>[] = [
  {
    slug: 'acoustic',
    name: 'Acoustic Solutions',
    description: 'Explore our range of acoustic panels and solutions for sound control and aesthetic design.',
    order: 0,
  },
  {
    slug: 'flooring',
    name: 'Flooring Solutions',
    description: 'Premium flooring solutions for commercial and residential spaces.',
    order: 1,
  },
  {
    slug: 'noise-solutions',
    name: 'Noise Solution',
    description: 'Comprehensive noise control and soundproofing solutions.',
    order: 2,
  },
];

async function seed(): Promise<void> {
  await connectDb();

  const coll = getCategoryCollection();
  const count = await coll.countDocuments();
  if (count > 0) {
    console.log(`Product categories already have ${count} document(s). Skipping seed.`);
    await disconnectDb();
    process.exit(0);
    return;
  }

  const now = new Date();
  await coll.insertMany(
    DEFAULT_CATEGORIES.map((c) => ({
      ...c,
      createdAt: now,
      updatedAt: now,
    }))
  );
  console.log(`Inserted ${DEFAULT_CATEGORIES.length} product categories.`);
  await disconnectDb();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Category seed failed:', err);
  process.exit(1);
});
