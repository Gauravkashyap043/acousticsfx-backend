/**
 * Idempotent product seed: inserts default products only when the collection is empty.
 * Run: npx tsx src/scripts/seedProducts.ts  (or npm run seed:products)
 */
import { connectDb, disconnectDb } from '../config/db.js';
import { getProductCollection } from '../models/Product.js';
import type { Product } from '../types/index.js';

const DEFAULT_PRODUCTS: Omit<Product, '_id'>[] = [
  {
    slug: 'wood-acoustic-panel',
    title: 'Wood Acoustic Panel',
    categorySlug: 'acoustic',
    description:
      'Acoustic wall panels made of wood stops reverberation and spreading sound waves better than panels made of steel and glass or concrete. The acoustic wood panel is used for sound insulation and acoustic arrangements. Acoustic wood panels eliminate echo problems. In order to maximize sound quality, the panel provides a premium acoustic arrangement.',
    image: '/assets/product/product-card-1.png',
    heroImage: '/assets/product/product-hero.png',
    subProducts: [
      {
        slug: 'linearlux',
        title: 'Linerlux',
        description:
          'Linearlux panels transform sound into an experience. With precision grooves and natural textures, they bring warmth and clarity to auditoriums, lecture halls, and public spaces—balancing technical performance with architectural elegance.',
        image: '/assets/panels/linerlux.png',
      },
      {
        slug: 'acoperf',
        title: 'Acoperf',
        description:
          'Acoperf panels feature precision perforations that enhance acoustic performance while maintaining elegant aesthetics. Perfect for modern spaces requiring both sound control and visual appeal.',
        image: '/assets/panels/acoperf.png',
      },
      {
        slug: 'microatlas',
        title: 'Microatlas',
        description:
          'Microatlas panels utilize micro-perforation technology for superior sound absorption. These advanced panels deliver exceptional acoustic performance with minimal visual impact, ideal for sophisticated architectural environments.',
        image: '/assets/panels/microatlas.png',
      },
      {
        slug: 'acoslots',
        title: 'Acoslots',
        description:
          'Acoslots panels feature strategic slot patterns that create distinctive visual textures while optimizing acoustic performance. These panels combine form and function for contemporary architectural applications.',
        image: '/assets/panels/acoslots.png',
      },
      {
        slug: 'perfomax',
        title: 'Perfomax',
        description:
          'Perfomax panels maximize acoustic performance through advanced perforation patterns. These high-performance panels deliver exceptional sound absorption while maintaining elegant design aesthetics for premium architectural projects.',
        image: '/assets/panels/perfomax.png',
      },
    ],
    order: 0,
  },
  {
    slug: 'fabric-acoustic-panel',
    categorySlug: 'acoustic',
    title: 'Fabric Acoustic Panel',
    description:
      'Fabric acoustic panels provide excellent sound absorption and aesthetic appeal. These versatile panels offer superior acoustic performance with customizable design options, making them ideal for modern spaces requiring both sound control and visual elegance.',
    image: '/assets/product/product-card-2.png',
    heroImage: '/assets/product/product-hero.png',
    subProducts: [],
    order: 1,
  },
  {
    slug: 'baffle-clouds',
    categorySlug: 'acoustic',
    title: 'Baffle & Clouds',
    description:
      'Baffle and cloud acoustic solutions provide effective sound absorption for large spaces. These suspended panels create stunning visual impact while delivering superior acoustic performance in auditoriums, offices, and commercial environments.',
    image: '/assets/product/product-card-3.png',
    heroImage: '/assets/product/product-hero.png',
    subProducts: [],
    order: 2,
  },
  {
    slug: 'wood-wool-acoustic-panel',
    categorySlug: 'acoustic',
    title: 'Wood Wool Acoustic Panel',
    description:
      'Wood wool acoustic panels combine natural wood fibers with excellent sound absorption properties. These eco-friendly panels provide sustainable acoustic solutions with natural aesthetics for modern architectural spaces.',
    image: '/assets/product/product-card-7.png',
    heroImage: '/assets/product/product-hero.png',
    subProducts: [],
    order: 3,
  },
];

async function seed(): Promise<void> {
  await connectDb();

  const coll = getProductCollection();
  const count = await coll.countDocuments();
  if (count > 0) {
    console.log(`Products collection already has ${count} document(s). Skipping seed.`);
    await disconnectDb();
    process.exit(0);
    return;
  }

  const now = new Date();
  await coll.insertMany(
    DEFAULT_PRODUCTS.map((p) => ({
      ...p,
      createdAt: now,
      updatedAt: now,
    }))
  );
  console.log(`Inserted ${DEFAULT_PRODUCTS.length} products.`);
  await disconnectDb();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Product seed failed:', err);
  process.exit(1);
});
