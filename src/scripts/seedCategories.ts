/**
 * Idempotent master categories seed: inserts default categories only when the collection is empty.
 * Run: npx tsx src/scripts/seedCategories.ts  (or npm run seed:categories)
 *
 * These are the "master categories" shown on hover "Our Products" and as tabs on /products.
 * Products link to them via categorySlug (e.g. products with categorySlug: 'acoustic' show under Acoustic Solutions).
 */
import { connectDb, disconnectDb } from '../config/db.js';
import { getCategoryCollection } from '../models/Category.js';
import type { ProductCategory } from '../types/index.js';

const DEFAULT_CATEGORIES: Omit<ProductCategory, '_id'>[] = [
  {
    slug: 'acoustic',
    name: 'Acoustic Solutions',
    description:
      'Explore our acoustic solutions — wood panels, fabric panels, baffles & clouds, wood wool panels, and more. NRC-certified quality for every space.',
    order: 0,
  },
  {
    slug: 'flooring',
    name: 'Flooring Solutions',
    description:
      'Premium flooring solutions that combine durability, aesthetics, and performance for commercial and residential spaces.',
    order: 1,
  },
  {
    slug: 'sound-proofing',
    name: 'Sound Proofing Solutions',
    description:
      'Complete sound proofing solutions to control noise transmission and create quieter, more comfortable environments.',
    order: 2,
  },
];

async function seed(): Promise<void> {
  await connectDb();

  const coll = getCategoryCollection();
  const count = await coll.countDocuments();
  if (count > 0) {
    console.log(`Product categories already has ${count} document(s). Skipping seed.`);
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
  console.log(`Inserted ${DEFAULT_CATEGORIES.length} master categories.`);
  await disconnectDb();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Categories seed failed:', err);
  process.exit(1);
});
